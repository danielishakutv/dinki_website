import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Scissors, CreditCard, MessageSquare, Star, Package, CheckCircle, AlertCircle, Info, ExternalLink, Bell, Loader2 } from 'lucide-react';
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

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await notifApi.get(id);
        setNotif(res.data);
        if (res.data && !res.data.is_read) {
          notifApi.markRead(id).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load notification:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

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

  const { icon: Icon, bg, color } = iconMap[notif.type] || defaultIcon;
  const dateStr = new Date(notif.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-heading font-bold text-gray-900">{notif.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{dateStr} &middot; {timeStr}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{notif.message || notif.body}</p>
        </div>

        {/* Action */}
        {notif.action_url && (
          <div className="px-5 py-4 border-t border-gray-50">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(notif.action_url)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <ExternalLink size={14} />
              View Details
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
