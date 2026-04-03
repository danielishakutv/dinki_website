import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Scissors, CreditCard, MessageSquare, Star, Package, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';

const notifDetails = {
  'notif-1': {
    type: 'job',
    title: 'Job Status Updated',
    message: 'Amina Bello\'s "3-Piece Ankara Ensemble" has moved to stitching phase.',
    detail: 'The cutting phase has been completed successfully. Your tailoring team has started the stitching process. Estimated completion is in 3 days. You can track this job in your Jobs dashboard.',
    time: '5 minutes ago',
    date: 'April 3, 2026',
    icon: Scissors,
    iconBg: 'bg-gold-50',
    iconColor: 'text-gold-500',
    actionLabel: 'View Job',
    actionLink: '/jobs',
  },
  'notif-2': {
    type: 'payment',
    title: 'Payment Received',
    message: 'You received \u20A6120,000 from Musa Abdullahi for Grand Agbada - Wedding.',
    detail: 'The full payment of \u20A6120,000 has been deposited to your Dinki wallet. The transaction reference is TXN-2026-0403-001. You can withdraw to your bank account at any time from Settings > Payments.',
    time: '1 hour ago',
    date: 'April 3, 2026',
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    actionLabel: 'View Payment',
    actionLink: '/settings',
  },
  'notif-3': {
    type: 'message',
    title: 'New Message',
    message: 'Fatima Yusuf sent you a message about sleeve design changes.',
    detail: 'Fatima would like to change the sleeve design of her Corporate Ankara Dress to bell sleeves. Please review and reply at your earliest convenience to avoid delays.',
    time: '2 hours ago',
    date: 'April 3, 2026',
    icon: MessageSquare,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    actionLabel: 'Open Chat',
    actionLink: '/messages/chat-3',
  },
  'notif-4': {
    type: 'review',
    title: 'New Review',
    message: 'Ibrahim Garba left a 5-star review: "Best Kaftan I\'ve ever owned!"',
    detail: '"Dinki Atelier is truly the best. The Kaftan was delivered on time, the embroidery was flawless, and the fit was perfect. I will definitely be coming back!" — Ibrahim Garba, 5 stars',
    time: '5 hours ago',
    date: 'April 3, 2026',
    icon: Star,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    actionLabel: 'View Reviews',
    actionLink: '/profile',
  },
  'notif-5': {
    type: 'order',
    title: 'New Order Request',
    message: 'Zainab Abubakar placed a new order for an Aso-Oke Bridal set.',
    detail: 'Zainab is requesting a custom Aso-Oke Bridal set for her wedding on May 15, 2026. She has provided reference images and measurements. Estimated budget: \u20A6300,000. Please review and accept or decline.',
    time: 'Yesterday',
    date: 'April 2, 2026',
    icon: Package,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    actionLabel: 'View Order',
    actionLink: '/jobs',
  },
  'notif-6': {
    type: 'system',
    title: 'Subscription Upgraded',
    message: 'Your Dinki Pro subscription is now active. Enjoy premium features!',
    detail: 'Welcome to Dinki Pro! You now have access to analytics dashboard, automated invoicing, priority marketplace listing, unlimited client profiles, and dedicated support. Your plan renews monthly at \u20A65,000.',
    time: 'Yesterday',
    date: 'April 2, 2026',
    icon: CheckCircle,
    iconBg: 'bg-gold-50',
    iconColor: 'text-gold-500',
    actionLabel: 'View Plan',
    actionLink: '/settings',
  },
  'notif-7': {
    type: 'reminder',
    title: 'Due Date Reminder',
    message: 'Halima Suleiman\'s Bubu wrapper is due in 2 days. Don\'t forget!',
    detail: 'The Bubu wrapper order for Halima Suleiman is scheduled for delivery on April 5, 2026. Please ensure final quality checks are completed and the garment is pressed and packaged.',
    time: '2 days ago',
    date: 'April 1, 2026',
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    actionLabel: 'View Job',
    actionLink: '/jobs',
  },
  'notif-8': {
    type: 'system',
    title: 'App Update Available',
    message: 'Version 2.1 is now available with improved measurements vault and new marketplace filters.',
    detail: 'What\'s new in v2.1:\n\n\u2022 Improved Measurements Vault with body diagram\n\u2022 Advanced marketplace filters by fabric type and price\n\u2022 Faster image loading for style gallery\n\u2022 Bug fixes and performance improvements\n\nThe update will be applied automatically.',
    time: '3 days ago',
    date: 'March 31, 2026',
    icon: Info,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
    actionLabel: null,
    actionLink: null,
  },
};

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notif = notifDetails[id];

  if (!notif) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Notification not found</p>
        <button onClick={() => navigate('/notifications')} className="mt-3 text-sm text-gold-600 font-medium">
          Back to Notifications
        </button>
      </div>
    );
  }

  const Icon = notif.icon;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/notifications')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Notifications
      </button>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-50">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={notif.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-heading font-bold text-gray-900">{notif.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{notif.date} &middot; {notif.time}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm font-medium text-gray-700 mb-3">{notif.message}</p>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{notif.detail}</p>
        </div>

        {/* Action */}
        {notif.actionLabel && (
          <div className="px-5 py-4 border-t border-gray-50">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(notif.actionLink)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <ExternalLink size={14} />
              {notif.actionLabel}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
