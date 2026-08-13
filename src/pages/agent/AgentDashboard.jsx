import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, Share2, Copy, Check, TrendingUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { agents as agentsApi } from '../../lib/api';
import { useApi, TTL } from '../../hooks/useApi';
import { StatTile, BarTrend, formatCount } from '../../components/charts';

/**
 * The agent's home.
 *
 * Three numbers lead, in the order they matter: how many people they brought,
 * how many of those actually set up their account, and how many went on to use
 * Dinki for real. The third is the one worth optimising — registering a hundred
 * people who never come back is not work worth celebrating, and a dashboard that
 * only showed signups would quietly encourage exactly that.
 */
export default function AgentDashboard() {
  const [copied, setCopied] = useState(false);

  const { data: res, loading } = useApi('agent-stats', () => agentsApi.stats(), { ttl: TTL.medium });
  const stats = res?.data;
  const totals = stats?.totals;

  const share = async () => {
    if (!stats?.inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Dinki Africa',
          text: 'Run your tailoring business on Dinki — customers, measurements, jobs and payments in one place.',
          url: stats.inviteLink,
        });
        return;
      } catch { /* user dismissed the sheet */ }
    }
    navigator.clipboard.writeText(stats.inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={26} className="animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5 pb-24 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Agent dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Everyone you've brought onto Dinki.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Registered" value={formatCount(totals?.registered || 0)} hint="Total brought" />
        <StatTile
          label="Set up"
          value={formatCount(totals?.claimed || 0)}
          hint={totals?.pending ? `${totals.pending} still to finish` : 'All done'}
        />
        <StatTile
          label="Using Dinki"
          value={formatCount(totals?.active || 0)}
          tone="good"
          hint="Doing real work"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          to="/agent/register"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gold-300 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
            <UserPlus size={18} className="text-gold-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm">Register someone</p>
            <p className="text-xs text-gray-400">Sign them up right now</p>
          </div>
        </Link>

        <button
          onClick={share}
          disabled={!stats?.inviteLink}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gold-300 transition text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
            {copied ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} className="text-gold-600" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm">
              {copied ? 'Link copied' : 'Share your link'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {stats?.code ? `Code ${stats.code}` : 'Unavailable'}
            </p>
          </div>
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gold-500" />
          <h2 className="font-heading font-semibold text-gray-800 text-sm">Sign-ups by week</h2>
          <span className="ml-auto text-[11px] text-gray-400">Last 8 weeks</span>
        </div>
        <BarTrend
          data={stats?.trend || []}
          xKey="week"
          yKey="registered"
          emptyLabel="Register someone to see your trend"
        />
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <h2 className="font-heading font-semibold text-gray-800 text-sm mb-3">How they joined</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">You registered them</span>
              <span className="font-semibold text-gray-800 tabular-nums">{totals?.direct || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Used your link</span>
              <span className="font-semibold text-gray-800 tabular-nums">{totals?.viaLink || 0}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <h2 className="font-heading font-semibold text-gray-800 text-sm mb-3">Who they are</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tailors</span>
              <span className="font-semibold text-gray-800 tabular-nums">
                {totals?.tailors || 0}
                {totals?.activeTailors ? (
                  <span className="text-emerald-600 font-normal"> · {totals.activeTailors} active</span>
                ) : null}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customers</span>
              <span className="font-semibold text-gray-800 tabular-nums">
                {totals?.customers || 0}
                {totals?.activeCustomers ? (
                  <span className="text-emerald-600 font-normal"> · {totals.activeCustomers} active</span>
                ) : null}
              </span>
            </div>
          </div>
        </section>
      </div>

      <Link
        to="/agent/recruits"
        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gold-300 transition"
      >
        <Users size={18} className="text-gold-600" />
        <span className="font-semibold text-gray-800 text-sm">See everyone you've registered</span>
        <span className="ml-auto text-xs text-gray-400">{totals?.registered || 0}</span>
      </Link>
    </div>
  );
}
