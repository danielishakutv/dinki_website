import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Image, Check, CheckCheck, Loader2 } from 'lucide-react';
import { conversations as convoApi, uploads as uploadsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

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
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: convoRes } = useApi(
    'conversations', () => convoApi.list(), { ttl: TTL.short }
  );
  const { data: msgRes, loading, refresh: refreshMessages } = useApi(
    `chat-messages-${id}`, () => convoApi.getMessages(id, { limit: 50 }), { ttl: TTL.short }
  );

  const convos = Array.isArray(convoRes?.data) ? convoRes.data : [];
  const convo = convos.find((c) => c.id === id);
  const participant = convo?.participant || null;
  const messages = (() => {
    const msgs = Array.isArray(msgRes?.data) ? msgRes.data : (msgRes?.data?.messages || []);
    return [...msgs].reverse();
  })();

  useEffect(() => {
    if (!loading && id) convoApi.markRead(id).catch(() => {});
  }, [id, loading]);
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }
    e.target.value = '';
    setSending(true);
    try {
      const uploadRes = await uploadsApi.image(file);
      const imageUrl = uploadRes.data?.url;
      if (imageUrl) {
        await convoApi.sendMessage(id, { image_url: imageUrl });
        invalidateCache(`chat-messages-${id}`, 'conversations');
        refreshMessages();
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
    setSending(true);
    try {
      await convoApi.sendMessage(id, { text });
      invalidateCache(`chat-messages-${id}`, 'conversations');
      refreshMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
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
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                  <img src={msg.image_url} alt="Shared" className="rounded-xl max-w-full mb-1.5" loading="lazy" />
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
          onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
}
