import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Image, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { conversations as convoApi, uploads as uploadsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';
import { getSocket } from '../lib/socket';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const initialLoadDone = useRef(false);

  const scrollToBottom = (instant) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  };

  const { data: convoRes } = useApi(
    'conversations', () => convoApi.list(), { ttl: TTL.short }
  );
  const { data: msgRes, loading } = useApi(
    `chat-messages-${id}`, () => convoApi.getMessages(id, { limit: 50 }), { ttl: TTL.long }
  );

  const convos = Array.isArray(convoRes?.data) ? convoRes.data : [];
  const convo = convos.find((c) => c.id === id);
  const participant = convo?.participant || null;

  // Seed local messages from API response
  useEffect(() => {
    if (!msgRes) return;
    const msgs = Array.isArray(msgRes?.data) ? msgRes.data : (msgRes?.data?.messages || []);
    setLocalMessages(msgs);
    initialLoadDone.current = true;
  }, [msgRes]);

  // Scroll on message count change
  useEffect(() => {
    if (localMessages.length > 0) {
      scrollToBottom(!initialLoadDone.current);
    }
  }, [localMessages.length]);

  // Mark as read on load
  useEffect(() => {
    if (!loading && id) convoApi.markRead(id).catch(() => {});
  }, [id, loading]);

  // Socket.IO real-time listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message }) => {
      if (message.conversation_id !== id) return;
      setLocalMessages((prev) => {
        // Deduplicate — avoid adding if already present (by id or optimistic match)
        if (prev.some((m) => m.id === message.id)) return prev;
        // Remove optimistic placeholder that matches
        const withoutOptimistic = prev.filter((m) => !m._optimistic || m.text !== message.text);
        return [...withoutOptimistic, message];
      });
      // Mark as read since we're looking at this conversation
      convoApi.markRead(id).catch(() => {});
      setTypingIndicator(false);
    };

    const handleDelivered = ({ messageId }) => {
      // Replace optimistic message with confirmed
      setLocalMessages((prev) => prev.map((m) => m._optimistic && !m.id ? { ...m, id: messageId, _optimistic: false } : m));
    };

    const handleTyping = ({ conversationId, typing }) => {
      if (conversationId !== id) return;
      setTypingIndicator(typing);
    };

    const handleRead = ({ conversationId }) => {
      if (conversationId !== id) return;
      // Mark all our messages as read
      setLocalMessages((prev) => prev.map((m) => m.sender_id === user?.id ? { ...m, is_read: true } : m));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:delivered', handleDelivered);
    socket.on('typing', handleTyping);
    socket.on('message:read', handleRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:delivered', handleDelivered);
      socket.off('typing', handleTyping);
      socket.off('message:read', handleRead);
    };
  }, [id, user?.id]);

  // Send typing indicator via socket
  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId: id });
  }, [id]);

  const handleTypingInput = (value) => {
    setNewMessage(value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }
    if (file.size > 800 * 1024) {
      alert('Image must be under 800KB. Please compress it before uploading.');
      e.target.value = '';
      return;
    }
    e.target.value = '';
    setSending(true);
    try {
      const uploadRes = await uploadsApi.image(file);
      const imageUrl = uploadRes.data?.url;
      if (imageUrl) {
        // Optimistic image message
        const optimistic = {
          _optimistic: true,
          sender_id: user?.id,
          image_url: imageUrl,
          text: null,
          created_at: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, optimistic]);

        await convoApi.sendMessage(id, { image_url: imageUrl });
        invalidateCache('conversations');
      }
    } catch (err) {
      console.error('Failed to send image:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setNewMessage('');
    emitTyping(false);

    // Optimistic message
    const optimistic = {
      _optimistic: true,
      sender_id: user?.id,
      text,
      image_url: null,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    setSending(true);
    try {
      await convoApi.sendMessage(id, { text });
      invalidateCache('conversations');
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic on failure
      setLocalMessages((prev) => prev.filter((m) => m !== optimistic));
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const p = participant || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-5rem)] md:h-[calc(100dvh-0px)] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-bold text-xs" style={{ backgroundColor: p.avatar_color || '#D4A574' }}>
            {p.initials || '?'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">{p.name || 'Chat'}</h2>
          <p className="text-xs text-gray-400">{p.role || ''}</p>
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <MoreVertical size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cloud">
        {localMessages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello!</p>
        )}
        <AnimatePresence initial={false}>
          {localMessages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id || `opt-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: msg._optimistic ? 0.7 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-gold-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Shared"
                      className="rounded-xl mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }}
                      loading="lazy"
                      onClick={() => setFullscreenImage(msg.image_url)}
                    />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                    {isMine && (
                      msg.is_read
                        ? <CheckCheck size={12} className="text-white/80" />
                        : <Check size={12} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {typingIndicator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-gray-100 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" disabled={sending}>
          <Image size={18} className="text-gray-400" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => handleTypingInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="w-10 h-10 rounded-xl bg-gold-500 hover:bg-gold-600 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
        </motion.button>
      </form>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} className="text-white" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size"
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
