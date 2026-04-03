import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pin, PinOff, Check, CheckCheck, MessageSquare } from 'lucide-react';

const mockChats = [
  {
    id: 'chat-1',
    name: 'Amina Bello',
    initials: 'AB',
    color: 'from-gold-400 to-amber-500',
    lastMessage: 'The Ankara fabric just arrived! When can I come for fitting?',
    time: '2m ago',
    unread: 3,
    online: true,
    pinned: true,
    delivered: true,
    read: false,
  },
  {
    id: 'chat-2',
    name: 'Musa Abdullahi',
    initials: 'MA',
    color: 'from-teal-400 to-emerald-500',
    lastMessage: 'Thank you! The Agbada is absolutely stunning.',
    time: '25m ago',
    unread: 0,
    online: true,
    pinned: true,
    delivered: true,
    read: true,
  },
  {
    id: 'chat-3',
    name: 'Fatima Yusuf',
    initials: 'FY',
    color: 'from-purple-400 to-pink-500',
    lastMessage: 'Can we change the sleeve design to bell sleeves?',
    time: '1h ago',
    unread: 1,
    online: false,
    pinned: false,
    delivered: true,
    read: false,
  },
  {
    id: 'chat-4',
    name: 'Ibrahim Garba',
    initials: 'IG',
    color: 'from-blue-400 to-indigo-400',
    lastMessage: 'I sent the reference images for the Kaftan embroidery.',
    time: '3h ago',
    unread: 0,
    online: false,
    pinned: false,
    delivered: true,
    read: true,
  },
  {
    id: 'chat-5',
    name: 'Halima Suleiman',
    initials: 'HS',
    color: 'from-rose-400 to-red-500',
    lastMessage: 'When will the Bubu wrapper be ready for pickup?',
    time: '5h ago',
    unread: 2,
    online: false,
    pinned: false,
    delivered: true,
    read: false,
  },
  {
    id: 'chat-6',
    name: 'Dinki Support',
    initials: 'DS',
    color: 'from-gold-500 to-gold-600',
    lastMessage: 'Your subscription has been upgraded to Pro! Enjoy premium features.',
    time: 'Yesterday',
    unread: 0,
    online: true,
    pinned: false,
    delivered: true,
    read: true,
  },
  {
    id: 'chat-7',
    name: 'Zainab Abubakar',
    initials: 'ZA',
    color: 'from-orange-400 to-red-400',
    lastMessage: 'Please can you make an Aso-Oke set for my daughter\'s wedding?',
    time: 'Yesterday',
    unread: 0,
    online: false,
    pinned: false,
    delivered: true,
    read: true,
  },
  {
    id: 'chat-8',
    name: 'Chukwu Emeka',
    initials: 'CE',
    color: 'from-emerald-400 to-teal-500',
    lastMessage: 'The corporate shirts are perfect. Will order more next month.',
    time: '2d ago',
    unread: 0,
    online: false,
    pinned: false,
    delivered: true,
    read: true,
  },
];

export default function Messages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState(mockChats);

  const togglePin = (id, e) => {
    e.stopPropagation();
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const filtered = chats
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const pinnedChats = filtered.filter((c) => c.pinned);
  const otherChats = filtered.filter((c) => !c.pinned);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Messages</h1>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        {chats.filter((c) => c.unread > 0).length} unread conversations
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

      {/* Pinned Section */}
      {pinnedChats.length > 0 && (
        <div className="mb-4">
          <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400 flex items-center gap-1">
            <Pin size={10} /> Pinned
          </p>
          <div className="space-y-1.5">
            {pinnedChats.map((chat) => (
              <ChatRow key={chat.id} chat={chat} onTogglePin={togglePin} onOpen={() => navigate(`/messages/${chat.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* All Messages */}
      <div>
        {pinnedChats.length > 0 && (
          <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
            All Messages
          </p>
        )}
        <div className="space-y-1.5">
          {otherChats.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No messages found</p>
          )}
          {otherChats.map((chat) => (
            <ChatRow key={chat.id} chat={chat} onTogglePin={togglePin} onOpen={() => navigate(`/messages/${chat.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatRow({ chat, onTogglePin, onOpen }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
        chat.unread > 0 ? 'bg-gold-50/60 border border-gold-100/50' : 'bg-white border border-gray-100 hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-heading font-bold text-sm`}>
          {chat.initials}
        </div>
        {chat.online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
            {chat.name}
          </h3>
          <span className={`text-[11px] flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-gold-600 font-semibold' : 'text-gray-400'}`}>
            {chat.time}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {chat.delivered && chat.read && <CheckCheck size={14} className="text-blue-500 flex-shrink-0" />}
          {chat.delivered && !chat.read && <Check size={14} className="text-gray-400 flex-shrink-0" />}
          <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
            {chat.lastMessage}
          </p>
        </div>
      </div>

      {/* Right side: unread badge or pin */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        {chat.unread > 0 && (
          <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center">
            {chat.unread}
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
