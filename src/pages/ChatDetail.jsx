import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Image, Check, CheckCheck } from 'lucide-react';

const chatDataMap = {
  'chat-1': {
    name: 'Amina Bello',
    initials: 'AB',
    color: 'from-gold-400 to-amber-500',
    online: true,
    messages: [
      { id: 1, sender: 'them', text: 'Good morning! I wanted to check on my Ankara Ensemble order.', time: '9:00 AM', read: true },
      { id: 2, sender: 'me', text: 'Good morning Amina! The cutting is complete. We are moving to stitching today.', time: '9:05 AM', read: true },
      { id: 3, sender: 'them', text: 'That\'s wonderful news! I\'m so excited.', time: '9:06 AM', read: true },
      { id: 4, sender: 'me', text: 'You\'ll love it! The Ankara print came out beautifully. I\'ll send photos once the first piece is done.', time: '9:10 AM', read: true },
      { id: 5, sender: 'them', text: 'Yes please! Can you also add some gold thread on the neckline like we discussed?', time: '9:15 AM', read: true },
      { id: 6, sender: 'me', text: 'Absolutely. Already planned for it. The gold thread will complement the print perfectly.', time: '9:20 AM', read: true },
      { id: 7, sender: 'them', text: 'The Ankara fabric just arrived! When can I come for fitting?', time: '10:30 AM', read: false },
    ],
  },
  'chat-2': {
    name: 'Musa Abdullahi',
    initials: 'MA',
    color: 'from-teal-400 to-emerald-500',
    online: true,
    messages: [
      { id: 1, sender: 'me', text: 'Musa, your Grand Agbada is ready for final fitting!', time: '8:00 AM', read: true },
      { id: 2, sender: 'them', text: 'Alhamdulillah! I\'ve been looking forward to this.', time: '8:05 AM', read: true },
      { id: 3, sender: 'me', text: 'The hand embroidery took extra time but it\'s worth every stitch. Gold and silver thread work is pristine.', time: '8:10 AM', read: true },
      { id: 4, sender: 'them', text: 'Can I come tomorrow at 2pm?', time: '8:12 AM', read: true },
      { id: 5, sender: 'me', text: 'Perfect. See you then. I\'ll have everything steamed and ready.', time: '8:15 AM', read: true },
      { id: 6, sender: 'them', text: 'Thank you! The Agbada is absolutely stunning.', time: '8:20 AM', read: true },
    ],
  },
  'chat-3': {
    name: 'Fatima Yusuf',
    initials: 'FY',
    color: 'from-purple-400 to-pink-500',
    online: false,
    messages: [
      { id: 1, sender: 'them', text: 'Hi! I have a question about my Corporate Ankara Dress.', time: '11:00 AM', read: true },
      { id: 2, sender: 'me', text: 'Of course Fatima, what would you like to know?', time: '11:05 AM', read: true },
      { id: 3, sender: 'them', text: 'Can we change the sleeve design to bell sleeves?', time: '11:10 AM', read: false },
    ],
  },
};

// Fallback for unknown chat IDs
const defaultChat = {
  name: 'Unknown',
  initials: '??',
  color: 'from-gray-400 to-gray-500',
  online: false,
  messages: [
    { id: 1, sender: 'them', text: 'Hello!', time: 'Just now', read: true },
  ],
};

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chat = chatDataMap[id] || defaultChat;
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(chat.messages);
  const fileInputRef = useRef(null);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      alert('Image must be under 1 MB.');
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'me', text: '', image: url, time: 'Just now', read: false },
    ]);
    e.target.value = '';
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'me',
        text: newMessage.trim(),
        time: 'Just now',
        read: false,
      },
    ]);
    setNewMessage('');
  };

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
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-heading font-bold text-xs`}>
            {chat.initials}
          </div>
          {chat.online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">{chat.name}</h2>
          <p className="text-xs text-gray-400">{chat.online ? 'Online' : 'Offline'}</p>
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <MoreVertical size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cloud">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'me'
                  ? 'bg-gold-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.image && (
                <img src={msg.image} alt="Shared" className="rounded-xl max-w-full mb-1.5" loading="lazy" />
              )}
              {msg.text && <p>{msg.text}</p>}
              <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-gray-400'}`}>
                <span className="text-[10px]">{msg.time}</span>
                {msg.sender === 'me' && (
                  msg.read
                    ? <CheckCheck size={12} className="text-white/80" />
                    : <Check size={12} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
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
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
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
          className="w-10 h-10 rounded-xl bg-gold-500 hover:bg-gold-600 flex items-center justify-center transition-colors shadow-sm"
        >
          <Send size={16} className="text-white" />
        </motion.button>
      </form>
    </div>
  );
}
