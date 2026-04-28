import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, AlertCircle, Users, Activity, TrendingUp, ShoppingBag,
  MessageSquare, Heart, Star, Scissors, UserCheck, Share2, Sparkles,
  BarChart3,
} from 'lucide-react';
import { admin as adminApi } from '../../lib/api';

/**
 * AdminAnalytics — product analytics dashboard.
 *
 * Reads from the six /admin/analytics/* endpoints in parallel. Every chart
 * is built from existing DB data (signups, activity, orders, referrals, …)
 * — no external instrumentation required for what's shown here.
 *
 * Browse-only navigation, screen-time, and search/filter usage live in
 * Matomo (separate stack) — there's a hint section at the bottom for that.
 */

const RANGE_OPTIONS = [
  { label: '7 days',  days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        // Cohorts table is anchored to weeks, not the day-range toggle.
        const tsDays = Math.max(days, 30);
        const [overview, timeseries, cohorts, funnels, marketplace, referrals] = await Promise.all([
          adminApi.analytics.overview(days),
          adminApi.analytics.timeseries(tsDays),
          adminApi.analytics.cohorts(8),
          adminApi.analytics.funnels(days),
          adminApi.analytics.marketplace(10),
          adminApi.analytics.referrals(10),
        ]);
        if (cancelled) return;
        setState({
          status: 'ok',
          data: {
            overview: overview.data,
            timeseries: timeseries.data,
            cohorts: cohorts.data,
            funnels: funnels.data,
            marketplace: marketplace.data,
            referrals: referrals.data,
          },
        });
      } catch (err) {
        if (cancelled) return;
        setState({ status: 'error', message: err.message || 'Request failed' });
      }
    })();

    return () => { cancelled = true; };
  }, [days]);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Could not load analytics</p>
          <p className="text-red-600/80 mt-0.5">{state.message}</p>
        </div>
      </div>
    );
  }

  const { overview, timeseries, cohorts, funnels, marketplace, referrals } = state.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-gold-500" />
          <h2 className="text-base font-heading font-semibold text-gray-800">Analytics</h2>
        </div>
        <RangeToggle value={days} onChange={setDays} />
      </div>

      <Kpis overview={overview} />
      <SignupsChart data={timeseries.series} />
      <CohortHeatmap cohorts={cohorts.cohorts} weeks={cohorts.weeks} />
      <Funnels data={funnels} />
      <Engagement overview={overview} />
      <MarketplaceTop data={marketplace} />
      <ReferralsBlock data={referrals} />
      <MatomoHint />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Range toggle                                                       *
 * ------------------------------------------------------------------ */

function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex p-1 bg-white border border-gray-100 rounded-xl text-xs">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.days}
          onClick={() => onChange(opt.days)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            value === opt.days
              ? 'bg-gold-500/10 text-gold-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  KPI bar                                                            *
 * ------------------------------------------------------------------ */

function Kpis({ overview }) {
  const stick = Math.round((overview.engagement.stickiness || 0) * 1000) / 10;
  return (
    <Section title="At a glance" subtitle={`Last ${overview.range_days} days`}>
      <Stat
        icon={Users}
        label="New signups"
        value={overview.users.new_signups}
        sub={`${overview.users.new_customers} customers · ${overview.users.new_tailors} tailors`}
        tone="emerald"
      />
      <Stat
        icon={Activity}
        label="DAU / MAU"
        value={`${overview.engagement.dau} / ${overview.engagement.mau}`}
        sub={`Stickiness ${stick}%`}
        tone="blue"
      />
      <Stat
        icon={UserCheck}
        label="Customer activation"
        value={`${overview.activation.customer_rate_pct}%`}
        sub={`${overview.activation.customers_activated}/${overview.activation.customer_signups} have measurements`}
        tone="gold"
      />
      <Stat
        icon={Scissors}
        label="Tailor activation"
        value={`${overview.activation.tailor_rate_pct}%`}
        sub={`${overview.activation.tailors_activated}/${overview.activation.tailor_signups} recorded measurements`}
        tone="gold"
      />
      <Stat
        icon={ShoppingBag}
        label="GMV"
        value={`₦${fmtMoney(overview.revenue.gmv)}`}
        sub={`${overview.revenue.completed_orders} completed orders`}
        tone="emerald"
      />
      <Stat
        icon={MessageSquare}
        label="Messages"
        value={overview.engagement.messages_sent}
        sub={`${overview.engagement.conversations_started} new conversations`}
        tone="blue"
      />
      <Stat
        icon={Heart}
        label="Favourites added"
        value={overview.engagement.favourites_added}
        tone="slate"
      />
      <Stat
        icon={Star}
        label="Reviews"
        value={overview.engagement.reviews_submitted}
        tone="slate"
      />
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 *  Signups + DAU line chart (SVG, no chart lib)                       *
 * ------------------------------------------------------------------ */

function SignupsChart({ data }) {
  const W = 720;
  const H = 220;
  const PAD_L = 32;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 24;

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxSignups = Math.max(1, ...data.map((d) => d.signups));
  const maxDau = Math.max(1, ...data.map((d) => d.dau));

  const x = (i) => PAD_L + (i * innerW) / Math.max(1, data.length - 1);
  const ySignups = (v) => PAD_T + innerH - (v / maxSignups) * innerH;
  const yDau = (v) => PAD_T + innerH - (v / maxDau) * innerH;

  const buildPath = (yFn, key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yFn(d[key]).toFixed(1)}`).join(' ');

  const signupsPath = buildPath(ySignups, 'signups');
  const dauPath = buildPath(yDau, 'dau');

  // x-axis labels — 5 evenly spaced
  const ticks = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1];

  return (
    <Section
      title="Growth & engagement"
      subtitle="Daily signups vs daily active users (last 90 days)"
    >
      <div className="col-span-full p-4 rounded-2xl bg-white border border-gray-100">
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
          <Legend color="#0EA5E9" label="Signups" right={maxSignups} />
          <Legend color="#D4A256" label="DAU" right={maxDau} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={PAD_L}
              x2={W - PAD_R}
              y1={PAD_T + innerH * p}
              y2={PAD_T + innerH * p}
              stroke="#F3F4F6"
              strokeWidth="1"
            />
          ))}
          {/* DAU area */}
          <path
            d={`${dauPath} L ${x(data.length - 1).toFixed(1)} ${PAD_T + innerH} L ${x(0).toFixed(1)} ${PAD_T + innerH} Z`}
            fill="#D4A256"
            fillOpacity="0.08"
          />
          {/* DAU line */}
          <path d={dauPath} stroke="#D4A256" strokeWidth="2" fill="none" />
          {/* Signups line */}
          <path d={signupsPath} stroke="#0EA5E9" strokeWidth="2" fill="none" />
          {/* x-axis tick labels */}
          {ticks.map((idx) =>
            data[idx] ? (
              <text
                key={idx}
                x={x(idx)}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#9CA3AF"
              >
                {shortDate(data[idx].date)}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </Section>
  );
}

function Legend({ color, label, right }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-500">
      <span className="inline-block w-3 h-0.5 rounded" style={{ background: color }} />
      <span>{label}</span>
      <span className="text-gray-400">peak {right}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Cohort retention heatmap                                           *
 * ------------------------------------------------------------------ */

function CohortHeatmap({ cohorts, weeks }) {
  if (!cohorts.length) {
    return (
      <Section title="Cohort retention" subtitle="Not enough data yet">
        <div className="col-span-full p-4 rounded-2xl bg-white border border-gray-100 text-sm text-gray-400">
          We'll show retention curves once a few weeks of signups have rolled through.
        </div>
      </Section>
    );
  }

  // Header offsets W0…W{weeks}
  const cols = Array.from({ length: weeks + 1 }, (_, i) => i);

  return (
    <Section
      title="Cohort retention"
      subtitle="% of each weekly cohort active in subsequent weeks (active = sent message, placed/updated order, moved a job, or logged in)"
    >
      <div className="col-span-full p-4 rounded-2xl bg-white border border-gray-100 overflow-x-auto">
        <table className="text-xs min-w-full">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left py-1.5 pr-3 font-medium">Cohort</th>
              <th className="text-right py-1.5 px-2 font-medium">Size</th>
              {cols.map((w) => (
                <th key={w} className="text-center py-1.5 px-1 font-medium">W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((row) => (
              <tr key={row.cohort} className="border-t border-gray-50">
                <td className="py-1.5 pr-3 text-gray-600 font-medium">{row.cohort}</td>
                <td className="py-1.5 px-2 text-right text-gray-500">{row.size}</td>
                {cols.map((w) => {
                  const count = row.retention[w];
                  if (count == null) {
                    return <td key={w} className="py-1.5 px-1" />;
                  }
                  const pct = row.size > 0 ? Math.round((count / row.size) * 100) : 0;
                  // Tile shade — null past the cohort age, otherwise ramp gold
                  const ageWeeks = weeksBetween(row.cohort);
                  if (w > ageWeeks) {
                    return <td key={w} className="py-1.5 px-1 text-gray-300 text-center">·</td>;
                  }
                  const bg = retentionColor(pct);
                  return (
                    <td
                      key={w}
                      className="py-1.5 px-1 text-center font-medium"
                      style={{ background: bg, color: pct > 55 ? '#fff' : '#374151' }}
                      title={`${count} of ${row.size}`}
                    >
                      {pct}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function retentionColor(pct) {
  // 0% → near-white, 100% → solid gold-500. Smooth lerp.
  const t = Math.max(0, Math.min(1, pct / 100));
  // gold-500 ≈ #D4A256
  const r = Math.round(255 - (255 - 0xD4) * t);
  const g = Math.round(255 - (255 - 0xA2) * t);
  const b = Math.round(255 - (255 - 0x56) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function weeksBetween(cohortIso) {
  const cohort = new Date(cohortIso);
  const now = new Date();
  const ms = now - cohort;
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

/* ------------------------------------------------------------------ *
 *  Activation + order/job funnels                                     *
 * ------------------------------------------------------------------ */

function Funnels({ data }) {
  const customer = [
    { label: 'Signed up',          count: data.customer.signed_up },
    { label: 'Email verified',     count: data.customer.email_verified },
    { label: 'Onboarded',          count: data.customer.onboarded },
    { label: 'Sent a message',     count: data.customer.sent_message },
    { label: 'Has measurements',   count: data.customer.has_measurements, activation: true },
    { label: 'Placed an order',    count: data.customer.placed_order },
  ];
  const tailor = [
    { label: 'Signed up',                count: data.tailor.signed_up },
    { label: 'Email verified',           count: data.tailor.email_verified },
    { label: 'Onboarded',                count: data.tailor.onboarded },
    { label: 'Storefront ready',         count: data.tailor.storefront_done },
    { label: 'Recorded measurements',    count: data.tailor.recorded_measurements, activation: true },
    { label: 'Posted a style',           count: data.tailor.posted_style },
    { label: 'Started a job',            count: data.tailor.started_job },
    { label: 'Completed an order',       count: data.tailor.completed_order },
  ];
  const orders = [
    { label: 'Pending',     count: data.orders.pending },
    { label: 'Accepted',    count: data.orders.accepted },
    { label: 'In progress', count: data.orders.in_progress },
    { label: 'Completed',   count: data.orders.completed },
  ];

  return (
    <Section
      title="Funnels"
      subtitle={`New users + recent orders, last ${data.range_days} days`}
    >
      <div className="col-span-full grid md:grid-cols-2 gap-4">
        <FunnelCard
          icon={Users}
          title="Customer activation"
          steps={customer}
          tone="blue"
        />
        <FunnelCard
          icon={Scissors}
          title="Tailor activation"
          steps={tailor}
          tone="gold"
        />
        <FunnelCard
          icon={ShoppingBag}
          title="Order pipeline"
          steps={orders}
          tone="emerald"
          subtitle={`${data.orders.cancelled} cancelled in window`}
        />
        <JobsCard data={data.jobs} />
      </div>
    </Section>
  );
}

function FunnelCard({ icon: Icon, title, subtitle, steps, tone = 'gold' }) {
  const top = Math.max(1, steps[0].count);
  const t = TONE[tone] || TONE.gold;
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>
          <Icon size={14} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-heading font-semibold text-gray-800">{title}</p>
          {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const widthPct = (s.count / top) * 100;
          const dropPct = i > 0 && steps[i - 1].count > 0
            ? Math.round(((steps[i - 1].count - s.count) / steps[i - 1].count) * 100)
            : null;
          const convPct = i > 0 && steps[i - 1].count > 0
            ? Math.round((s.count / steps[i - 1].count) * 100)
            : null;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
                <span className={s.activation ? 'text-gold-600 font-semibold' : ''}>
                  {s.activation && <span className="mr-1">★</span>}
                  {s.label}
                  {s.activation && <span className="ml-1 text-[9px] uppercase tracking-wider text-gold-500">Activation</span>}
                </span>
                <span>
                  <span className="text-gray-700 font-medium">{fmt(s.count)}</span>
                  {convPct != null && (
                    <span className="text-gray-400 ml-2">{convPct}% step</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.activation ? 'bg-gold-500' : t.bar}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {dropPct != null && dropPct > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">−{dropPct}% drop-off</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobsCard({ data }) {
  const steps = [
    { label: 'Cutting',   count: data.cutting },
    { label: 'Stitching', count: data.stitching },
    { label: 'Ready',     count: data.ready },
    { label: 'Delivered', count: data.delivered },
  ];
  const top = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
          <Scissors size={14} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-heading font-semibold text-gray-800">Jobs in flight</p>
          <p className="text-[11px] text-gray-400">{data.total} jobs created in window</p>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s) => {
          const widthPct = (s.count / top) * 100;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
                <span>{s.label}</span>
                <span className="text-gray-700 font-medium">{fmt(s.count)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gold-500" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Engagement                                                         *
 * ------------------------------------------------------------------ */

function Engagement({ overview }) {
  const e = overview.engagement;
  return (
    <Section title="Engagement" subtitle={`Last ${overview.range_days} days`}>
      <Stat icon={MessageSquare} label="Messages sent" value={e.messages_sent} tone="blue" />
      <Stat icon={Users} label="Active conversations" value={e.conversations_started} sub="newly started" tone="blue" />
      <Stat icon={Heart} label="Favourites" value={e.favourites_added} tone="rose" />
      <Stat icon={Star} label="Reviews" value={e.reviews_submitted} tone="gold" />
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 *  Marketplace top-N                                                  *
 * ------------------------------------------------------------------ */

function MarketplaceTop({ data }) {
  return (
    <Section title="Top of the marketplace" subtitle="What's getting traction">
      <div className="col-span-full grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100">
          <p className="text-sm font-heading font-semibold text-gray-800 mb-3">Top styles</p>
          {data.top_styles.length === 0 ? (
            <p className="text-xs text-gray-400">No marketplace styles yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.top_styles.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="text-gray-700 font-medium truncate">{s.title}</p>
                    <p className="text-gray-400 truncate">{s.tailor_name || '—'} · ₦{fmtMoney(s.price)}</p>
                  </div>
                  <div className="text-right text-gray-500 whitespace-nowrap pl-3">
                    <span className="inline-flex items-center gap-1"><Heart size={11} /> {s.favourite_count}</span>
                    <span className="ml-2 text-gray-400">{s.view_count} views</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100">
          <p className="text-sm font-heading font-semibold text-gray-800 mb-3">Top tailors by orders</p>
          {data.top_tailors.length === 0 ? (
            <p className="text-xs text-gray-400">No tailor activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.top_tailors.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="text-gray-700 font-medium truncate">{t.name}</p>
                    <p className="text-gray-400 truncate">
                      {t.username ? `@${t.username}` : '—'}
                      {t.rating_avg ? ` · ${Number(t.rating_avg).toFixed(1)}★ (${t.rating_count})` : ''}
                    </p>
                  </div>
                  <div className="text-right text-gray-500 whitespace-nowrap pl-3">
                    <span className="text-gray-700 font-medium">{t.orders_received}</span> orders
                    <span className="ml-2 text-gray-400">{t.orders_completed} done</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {data.notifications_30d.length > 0 && (
        <div className="col-span-full p-4 rounded-2xl bg-white border border-gray-100">
          <p className="text-sm font-heading font-semibold text-gray-800 mb-3">
            Notification read-rate (last 30 days)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.notifications_30d.map((n) => (
              <div key={n.type} className="p-3 rounded-xl bg-gray-50">
                <p className="text-[11px] text-gray-500 capitalize">{n.type}</p>
                <p className="text-base font-heading font-bold text-gray-800 mt-0.5">
                  {n.read_rate_pct}%
                </p>
                <p className="text-[10px] text-gray-400">{n.read} of {n.sent} read</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 *  Referrals                                                          *
 * ------------------------------------------------------------------ */

function ReferralsBlock({ data }) {
  const f = data.funnel;
  const k = data.k_factor;
  return (
    <Section title="Referrals" subtitle={`${k.share_pct}% of users came in via a referral`}>
      <Stat icon={Share2} label="Invites sent" value={f.invited} sub={`${f.active_inviters} active inviters`} tone="blue" />
      <Stat icon={UserCheck} label="Joined" value={f.joined} sub={`${f.join_rate_pct}% accept rate`} tone="emerald" />
      <Stat icon={Sparkles} label="Rewarded" value={f.rewarded} tone="gold" />
      <Stat icon={TrendingUp} label="Referral share" value={`${k.share_pct}%`} sub={`${k.referred_users} of ${k.total_users} users`} tone="blue" />

      {data.top_referrers.length > 0 && (
        <div className="col-span-full p-4 rounded-2xl bg-white border border-gray-100">
          <p className="text-sm font-heading font-semibold text-gray-800 mb-3">Top referrers</p>
          <ul className="space-y-2">
            {data.top_referrers.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="text-gray-700 font-medium truncate">{u.name}</p>
                  <p className="text-gray-400 truncate">
                    {u.username ? `@${u.username}` : '—'} · code {u.referral_code || '—'}
                  </p>
                </div>
                <div className="text-right text-gray-500 whitespace-nowrap pl-3">
                  <span className="text-gray-700 font-medium">{u.joined}</span> joined
                  <span className="ml-2 text-gray-400">of {u.invites}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 *  Matomo hint — what this dashboard CAN'T tell us                    *
 * ------------------------------------------------------------------ */

function MatomoHint() {
  return (
    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-sm">
      <p className="font-heading font-semibold text-blue-900 mb-1">
        What this dashboard can't show
      </p>
      <p className="text-blue-900/80 text-xs leading-relaxed">
        Page navigation, time-on-screen, search queries, filter usage, and
        drop-off in flows that don't write to the database — those need
        client-side instrumentation (Matomo). Once we wire Matomo events,
        a second tab here will surface them alongside this product data.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Shared layout primitives                                           *
 * ------------------------------------------------------------------ */

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-heading font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 ml-3 truncate">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {children}
      </div>
    </section>
  );
}

const TONE = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    bar: 'bg-blue-500' },
  gold:    { bg: 'bg-gold-50',    text: 'text-gold-600',    bar: 'bg-gold-500' },
  slate:   { bg: 'bg-gray-100',   text: 'text-gray-600',    bar: 'bg-gray-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    bar: 'bg-rose-500' },
};

function Stat({ icon: Icon, label, value, sub, tone = 'slate' }) {
  const t = TONE[tone] || TONE.slate;
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100">
      <div className={`w-9 h-9 rounded-xl ${t.bg} ${t.text} flex items-center justify-center mb-3`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-heading font-bold text-gray-900 mt-0.5 break-all">{fmt(value)}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  if (typeof n === 'string') return n;
  return new Intl.NumberFormat('en-US').format(n);
}

function fmtMoney(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}k`;
  return new Intl.NumberFormat('en-US').format(num);
}

function shortDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}
