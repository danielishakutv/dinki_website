import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Scissors, CreditCard, MessageSquare, Star, Package, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { notifications as notifApi } from '../lib/api';

const iconMap = {
  job: { icon: Scissors, bg: 'bg-gold-50', color: 'text-gold-500' },
  payment: { icon: CreditCard, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  message: { icon: MessageSquare, bg: 'bg-blue-50', color: 'text-blue-500' },
  review: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-500' },
  order: { icon: Package, bg: 'bg-purple-50', color: 'text-purple-500' },
  reminder: { icon: AlertCircle, bg: 'bg-orange-50', color: 'text-orange-500' },
  system: { icon: Info, bg: 'bg-gray-100', color: 'text-gray-500' },
  success: { icon: CheckCircle, bg: 'bg-gold-50', color: 'text-gold-500' },
};

const defaultIcon = { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-500' };

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

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notifApi.list();
      const d = res.data || {};
      if (Array.isArray(d)) {
        setNotifications(d);
      } else {
        setNotifications([...(d.today || []), ...(d.earlier || [])]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await notifApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const today = notifications.filter((n) => isToday(n.created_at));
  const earlier = notifications.filter((n) => !isToday(n.created_at));

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
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={22} className="text-gold-500" />
            <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Notifications</h1>
          </div>
          <p className="text-sm text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={markAllRead}
            className="px-3 py-2 rounded-xl text-xs font-medium text-gold-600 bg-gold-50 hover:bg-gold-100 transition-colors"
          >
            Mark all read
          </motion.button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No notifications yet</p>
        </div>
      )}

      {/* Today */}
      {today.length > 0 && (
        <div className="mb-5">
          <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
            Today
          </p>
          <div className="space-y-1.5">
            {today.map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onClick={() => navigate(`/notifications/${notif.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Earlier */}
      {earlier.length > 0 && (
        <div>
          <p className="px-1 mb-2 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
            Earlier
          </p>
          <div className="space-y-1.5">
            {earlier.map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onClick={() => navigate(`/notifications/${notif.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notif, onClick }) {
  const { icon: Icon, bg, color } = iconMap[notif.type] || defaultIcon;
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
        !notif.is_read
          ? 'bg-gold-50/60 border border-gold-100/50'
          : 'bg-white border border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={`text-sm truncate ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
            {notif.title}
          </h3>
          {!notif.is_read && (
            <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
          )}
        </div>
        <p className={`text-xs leading-relaxed ${!notif.is_read ? 'text-gray-600' : 'text-gray-400'}`}>
          {notif.message || notif.body}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
      </div>
    </motion.div>
  );
}
