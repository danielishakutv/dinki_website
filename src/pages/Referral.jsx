import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, Star, Loader2, AlertCircle, Clock } from 'lucide-react';
import { referrals as referralsApi } from '../lib/api';
import { useApi, TTL } from '../hooks/useApi';

/**
 * Referral — shows the authenticated user's REAL referral code, share link
 * and stats. All data is fetched from /v1/referrals/me; nothing here is
 * mocked.
 */
export default function Referral() {
  const [copied, setCopied] = useState(false);

  const { data: res, loading, error, refresh } = useApi(
    'referrals-me',
    () => referralsApi.getMine({ limit: 20 }),
    { ttl: TTL.medium },
  );

  const payload = res?.data || {};
  const code = payload.code || '';
  const inviteLink = payload.inviteLink || '';
  const stats = payload.stats || { invited: 0, joined: 0, rewarded: 0, totalReward: 0 };
  const referees = payload.referees || [];

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Dinki Africa',
          text: `Join me on Dinki Africa — custom African fashion, straight from talented tailors. My invite link:`,
          url: inviteLink,
        });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(inviteLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !res) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Could not load your referrals</p>
            <p className="text-red-600/80 mt-0.5">{error.message || 'Please try again in a moment.'}</p>
          </div>
          <button
            onClick={refresh}
            className="text-xs font-semibold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Invited', value: stats.invited, icon: Clock },
    { label: 'Joined', value: stats.joined, icon: Check },
    { label: 'Rewarded', value: stats.rewarded, icon: Star },
  ];

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
          <Gift size={28} className="text-white" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Invite Friends</h1>
        <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">
          Share Dinki Africa with friends — each person who joins helps grow the community.
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 mb-2">YOUR REFERRAL CODE</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 text-center">
            <p className="text-lg font-heading font-bold text-gold-700 tracking-widest break-all">
              {code || '—'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            disabled={!code}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </motion.button>
        </div>
        {inviteLink && (
          <p className="mt-3 text-[11px] text-gray-400 break-all">
            Link: <span className="text-gray-600">{inviteLink}</span>
          </p>
        )}
      </div>

      {/* Share Button */}
      <button
        onClick={shareLink}
        disabled={!inviteLink}
        className="w-full py-3.5 bg-white text-gray-800 rounded-2xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
      >
        <Share2 size={16} />
        Share Invite Link
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <stat.icon size={16} className="text-gold-500 mx-auto mb-1.5" />
            <p className="text-lg font-heading font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referees list */}
      {referees.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h3 className="font-heading font-semibold text-gray-800 text-sm">People you've invited</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {referees.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full avatar-gradient flex items-center justify-center text-white font-heading font-bold text-xs flex-shrink-0">
                  {r.initials || (r.user_name || r.referee_email || '??').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {r.user_name || r.referee_email}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {r.user_role ? `${r.user_role} · ` : ''}{fmtRelative(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your link', desc: 'Send your unique invite link to friends' },
            { step: '2', title: 'They sign up', desc: 'When they create an account, the referral is recorded' },
            { step: '3', title: 'Their status moves', desc: 'Invited → Joined once they verify their email' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    invited:  { label: 'Invited',  color: 'bg-gray-100 text-gray-600' },
    joined:   { label: 'Joined',   color: 'bg-emerald-50 text-emerald-600' },
    rewarded: { label: 'Rewarded', color: 'bg-gold-50 text-gold-600' },
  };
  const s = map[status] || map.invited;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

function fmtRelative(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
