import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Pin, PinOff, Check, CheckCheck, MessageSquare, Loader2 } from 'lucide-react';
import { conversations as convoApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: convoRes, loading } = useApi(
    'conversations', () => convoApi.list(), { ttl: TTL.short }
  );
  const chats = convoRes?.data && Array.isArray(convoRes.data) ? convoRes.data : [];

  const togglePin = async (id, e) => {
    e.stopPropagation();
    try {
      await convoApi.togglePin(id);
      invalidateCache('conversations');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const filtered = chats
    .filter((c) => {
      const name = c.participant?.name || '';
      const msg = c.last_message?.text || '';
      const q = search.toLowerCase();
      return name.toLowerCase().includes(q) || msg.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const pinnedChats = filtered.filter((c) => c.pinned);
  const otherChats = filtered.filter((c) => !c.pinned);
  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Messages</h1>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        {totalUnread > 0 ? `${totalUnread} unread conversations` : 'All caught up'}
      </p>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
        />
      </div>

      {chats.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No conversations yet</p>
        </div>
      )}

      {/* Pinned Section */}
      {pinnedChats.length > 0 && (
        <div className="mb-4">
          <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400 flex items-center gap-1">
            <Pin size={10} /> Pinned
          </p>
          <div className="space-y-1.5">
            {pinnedChats.map((chat) => (
              <ChatRow key={chat.id} chat={chat} userId={user?.id} onTogglePin={togglePin} onOpen={() => navigate(`/messages/${chat.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* All Messages */}
      {otherChats.length > 0 && (
        <div>
          {pinnedChats.length > 0 && (
            <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
              All Messages
            </p>
          )}
          <div className="space-y-1.5">
            {otherChats.map((chat) => (
              <ChatRow key={chat.id} chat={chat} userId={user?.id} onTogglePin={togglePin} onOpen={() => navigate(`/messages/${chat.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatRow({ chat, userId, onTogglePin, onOpen }) {
  const p = chat.participant || {};
  const lastMsg = chat.last_message;
  const isMine = lastMsg?.sender_id === userId;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
        chat.unread_count > 0 ? 'bg-gold-50/60 border border-gold-100/50' : 'bg-white border border-gray-100 hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-heading font-bold text-sm" style={{ backgroundColor: p.avatar_color || '#D4A574' }}>
          {p.initials || '?'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-sm truncate ${chat.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
            {p.name || 'Unknown'}
          </h3>
          <span className={`text-[11px] flex-shrink-0 ml-2 ${chat.unread_count > 0 ? 'text-gold-600 font-semibold' : 'text-gray-400'}`}>
            {lastMsg ? timeAgo(lastMsg.created_at) : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isMine && lastMsg?.is_read && <CheckCheck size={14} className="text-blue-500 flex-shrink-0" />}
          {isMine && !lastMsg?.is_read && <Check size={14} className="text-gray-400 flex-shrink-0" />}
          <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
            {lastMsg?.text || 'No messages yet'}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        {chat.unread_count > 0 && (
          <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center">
            {chat.unread_count}
          </span>
        )}
        <button
          onClick={(e) => onTogglePin(chat.id, e)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {chat.pinned ? (
            <Pin size={13} className="text-gold-500" />
          ) : (
            <PinOff size={13} className="text-gray-300" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
