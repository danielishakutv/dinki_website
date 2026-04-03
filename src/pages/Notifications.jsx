import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Scissors, CreditCard, MessageSquare, Star, Package, CheckCircle, AlertCircle, Info } from 'lucide-react';

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'job',
    title: 'Job Status Updated',
    message: 'Amina Bello\'s "3-Piece Ankara Ensemble" has moved to stitching phase.',
    time: '5 minutes ago',
    read: false,
    icon: Scissors,
    iconBg: 'bg-gold-50',
    iconColor: 'text-gold-500',
  },
  {
    id: 'notif-2',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received \u20A6120,000 from Musa Abdullahi for Grand Agbada - Wedding.',
    time: '1 hour ago',
    read: false,
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'notif-3',
    type: 'message',
    title: 'New Message',
    message: 'Fatima Yusuf sent you a message about sleeve design changes.',
    time: '2 hours ago',
    read: false,
    icon: MessageSquare,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    id: 'notif-4',
    type: 'review',
    title: 'New Review',
    message: 'Ibrahim Garba left a 5-star review: "Best Kaftan I\'ve ever owned!"',
    time: '5 hours ago',
    read: true,
    icon: Star,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    id: 'notif-5',
    type: 'order',
    title: 'New Order Request',
    message: 'Zainab Abubakar placed a new order for an Aso-Oke Bridal set.',
    time: 'Yesterday',
    read: true,
    icon: Package,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'Subscription Upgraded',
    message: 'Your Dinki Pro subscription is now active. Enjoy premium features!',
    time: 'Yesterday',
    read: true,
    icon: CheckCircle,
    iconBg: 'bg-gold-50',
    iconColor: 'text-gold-500',
  },
  {
    id: 'notif-7',
    type: 'reminder',
    title: 'Due Date Reminder',
    message: 'Halima Suleiman\'s Bubu wrapper is due in 2 days. Don\'t forget!',
    time: '2 days ago',
    read: true,
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    id: 'notif-8',
    type: 'system',
    title: 'App Update Available',
    message: 'Version 2.1 is now available with improved measurements vault and new marketplace filters.',
    time: '3 days ago',
    read: true,
    icon: Info,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const today = notifications.filter((n) => !n.time.includes('day') && !n.time.includes('Yesterday'));
  const earlier = notifications.filter((n) => n.time.includes('Yesterday') || n.time.includes('day'));

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
  const Icon = notif.icon;
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors ${
        !notif.read
          ? 'bg-gold-50/60 border border-gold-100/50'
          : 'bg-white border border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={notif.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={`text-sm truncate ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
            {notif.title}
          </h3>
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
          )}
        </div>
        <p className={`text-xs leading-relaxed ${!notif.read ? 'text-gray-600' : 'text-gray-400'}`}>
          {notif.message}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
      </div>
    </motion.div>
  );
}
