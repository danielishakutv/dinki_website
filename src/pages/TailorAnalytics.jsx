import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, Star, Users, TrendingUp, Loader2 } from 'lucide-react';
import { analytics as analyticsApi } from '../lib/api';
import { useApi, TTL } from '../hooks/useApi';
import { useLocalAnalytics } from '../hooks/useLocal';
import SyncStatusPill from '../components/SyncStatusPill';
import { StatTile, BarTrend, StageBar, RankedBars, formatNaira, formatCount } from '../components/charts';

/**
 * Tailor analytics.
 *
 * Two data sources, deliberately separated. Everything about jobs, revenue and
 * customers is computed from the device's own database, so it renders instantly
 * and works with no signal. Only the four things the phone genuinely cannot know
 * — storefront visits, marketplace orders, reviews, referrals — come from the
 * API, and that section degrades on its own without taking the page with it.
 */

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function Section({ title, icon: Icon, children, aside }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} className="text-gold-500" />}
        <h2 className="font-heading font-semibold text-gray-800 text-sm">{title}</h2>
        {aside && <span className="ml-auto text-[11px] text-gray-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export default function TailorAnalytics() {
  const [days, setDays] = useState(30);

  const { data: local, loading: localLoading } = useLocalAnalytics({ days });
  const { data: serverRes, loading: serverLoading, error: serverError } = useApi(
    `analytics-tailor-${days}`,
    () => analyticsApi.tailor(days),
    { ttl: TTL.long }
  );
  const server = serverRes?.data;

  if (localLoading || !local) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={26} className="animate-spin text-gold-500" />
      </div>
    );
  }

  const { revenue, jobs, customers } = local;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-gold-500" />
          <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Your business</h1>
        </div>
        <SyncStatusPill />
      </div>

      {/* Range filter sits in one row above everything it affects. */}
      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              days === r.days
                ? 'bg-gold-500 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Headline numbers — stat tiles, not a chart, because each is one value. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={`Earned · ${days}d`}
          value={formatNaira(revenue.window)}
          hint="From delivered jobs"
        />
        <StatTile label="Active jobs" value={formatCount(jobs.active)} hint="Cutting or stitching" />
        <StatTile
          label="Awaiting payment"
          value={formatCount(jobs.ready)}
          tone={jobs.ready > 0 ? 'warn' : 'default'}
          hint="Ready, not invoiced"
        />
        <StatTile
          label="Overdue"
          value={formatCount(jobs.overdue)}
          tone={jobs.overdue > 0 ? 'warn' : 'good'}
          hint={jobs.overdue > 0 ? 'Past the due date' : 'Nothing late'}
        />
      </div>

      <Section title="Earnings by month" icon={TrendingUp} aside="Last 6 months">
        <BarTrend
          data={revenue.trend}
          xKey="label"
          yKey="value"
          money
          emptyLabel="Deliver a job to start tracking earnings"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
          <div>
            <p className="text-[11px] text-gray-400">All-time earned</p>
            <p className="text-sm font-semibold text-gray-800">{formatNaira(revenue.allTime)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Average job</p>
            <p className="text-sm font-semibold text-gray-800">
              {revenue.averageValue == null ? '—' : formatNaira(revenue.averageValue)}
            </p>
          </div>
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Where your jobs are" icon={BarChart3}>
          <StageBar segments={jobs.stages} />
          {jobs.completionRate != null && (
            <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
              You've finished <span className="font-semibold text-gray-800">{jobs.completionRate}%</span>{' '}
              of every job you've taken.
            </p>
          )}
        </Section>

        <Section title="Your customers" icon={Users}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-lg font-heading font-bold text-gray-900 tabular-nums">{customers.total}</p>
              <p className="text-[11px] text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-heading font-bold text-gray-900 tabular-nums">{customers.newInWindow}</p>
              <p className="text-[11px] text-gray-400">New · {days}d</p>
            </div>
            <div>
              <p className="text-lg font-heading font-bold text-gray-900 tabular-nums">{customers.returning}</p>
              <p className="text-[11px] text-gray-400">Repeat</p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
            Top by spend
          </p>
          <RankedBars items={customers.topCustomers} money emptyLabel="No delivered jobs yet" />
        </Section>
      </div>

      {customers.dormant.length > 0 && (
        <Section title="Haven't ordered in a while" icon={Users} aside="90+ days">
          <div className="space-y-1.5">
            {customers.dormant.map((c) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gold-600"
              >
                <span className="truncate">{c.name}</span>
                <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                  {new Date(c.last).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            A quick message often brings them back.
          </p>
        </Section>
      )}

      {/* Online-only section. It fails on its own — the rest of the page above
          is already useful without it. */}
      <Section title="Storefront & marketplace" icon={Eye} aside="Needs internet">
        {serverLoading && !server ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : serverError || !server ? (
          <p className="text-xs text-gray-400 py-3">
            These figures live on the server and will appear when you're back online.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatTile
                label={`Visits · ${days}d`}
                value={formatCount(server.visits.inWindow)}
                hint="Storefront page views"
              />
              <StatTile label="Orders" value={formatCount(server.orders.total)} hint={`Last ${days} days`} />
              <StatTile
                label="Accepted"
                value={server.orders.acceptanceRate == null ? '—' : `${server.orders.acceptanceRate}%`}
                hint={server.orders.acceptanceRate == null ? 'No orders yet' : 'Of orders received'}
              />
              <StatTile
                label="Rating"
                value={server.reviews.total ? server.reviews.average.toFixed(1) : '—'}
                hint={server.reviews.total ? `${server.reviews.total} reviews` : 'No reviews yet'}
              />
            </div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
              Profile visits
            </p>
            <BarTrend
              data={server.visits.trend}
              xKey="day"
              yKey="count"
              height={110}
              emptyLabel="No visits recorded yet"
            />
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Star size={13} className="text-gold-500" />
                You've invited {server.referrals.total} — {server.referrals.joined} joined
              </div>
              <Link to="/referral" className="text-xs font-medium text-gold-600 hover:underline">
                Invite more
              </Link>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
