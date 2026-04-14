import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, Star } from 'lucide-react';

export default function Referral() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'DINKI-AF2026';
  const referralLink = `https://dinki.africa/invite/${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Dinki Africa',
          text: `Join me on Dinki Africa — the best way to find tailors and get custom African fashion. Use my code: ${referralCode}`,
          url: referralLink,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(referralLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralStats = [
    { label: 'Friends Invited', value: '3', icon: Users },
    { label: 'Joined', value: '2', icon: Check },
    { label: 'Rewards Earned', value: '₦1,500', icon: Star },
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
          Share Dinki Africa with friends and earn ₦500 credit for each person who joins.
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 mb-2">YOUR REFERRAL CODE</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 text-center">
            <p className="text-lg font-heading font-bold text-gold-700 tracking-widest">{referralCode}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </motion.button>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={shareLink}
        className="w-full py-3.5 bg-white text-gray-800 rounded-2xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
      >
        <Share2 size={16} />
        Share Invite Link
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {referralStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <stat.icon size={16} className="text-gold-500 mx-auto mb-1.5" />
            <p className="text-lg font-heading font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your unique referral code to friends' },
            { step: '2', title: 'They sign up', desc: 'Your friend creates an account using your code' },
            { step: '3', title: 'You both earn', desc: 'You get ₦500 credit, they get ₦250 off their first order' },
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
