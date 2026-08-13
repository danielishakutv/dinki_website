import { getDb } from './db';

/**
 * Business analytics computed on the device.
 *
 * Since the offline-first work, a tailor's jobs and customers are already
 * mirrored into IndexedDB, so every number here can be derived locally. That is
 * a deliberate choice rather than a shortcut: the tailor most in need of seeing
 * how the month is going is the one sitting in a workshop with no signal, and a
 * dashboard that needs a network to show data the phone already holds would fail
 * exactly then.
 *
 * Only genuinely server-side facts — storefront visits, marketplace orders,
 * reviews, referrals — come from the API.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

/** Naira, stored as whole units on jobs.price. */
function priceOf(job) {
  return Number(job.price) || 0;
}

export async function computeLocalAnalytics({ days = 30 } = {}) {
  const db = getDb();
  const [jobs, customers] = await Promise.all([
    db.jobs.where('_deleted').equals(0).toArray(),
    db.customers.where('_deleted').equals(0).toArray(),
  ]);

  const since = Date.now() - days * DAY_MS;
  const delivered = jobs.filter((j) => j.status === 'delivered');
  const active = jobs.filter((j) => j.status === 'cutting' || j.status === 'stitching');
  const ready = jobs.filter((j) => j.status === 'ready');
  const todayIso = isoDay(Date.now());

  // --- revenue --------------------------------------------------------------
  // Revenue is recognised on delivery, matching the server's own definition in
  // jobs.getStats — two different numbers for "revenue" in one app would be
  // worse than having none.
  const deliveredInWindow = delivered.filter(
    (j) => j.delivered_at && new Date(j.delivered_at).getTime() >= since
  );
  const revenueWindow = deliveredInWindow.reduce((sum, j) => sum + priceOf(j), 0);
  const revenueAllTime = delivered.reduce((sum, j) => sum + priceOf(j), 0);

  // Monthly buckets for the trend, oldest first, gaps filled so a quiet month
  // reads as a gap in the bar chart rather than silently collapsing the axis.
  const monthly = new Map();
  const monthsBack = 6;
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthly.set(monthKey(d), 0);
  }
  for (const job of delivered) {
    if (!job.delivered_at) continue;
    const key = monthKey(job.delivered_at);
    if (monthly.has(key)) monthly.set(key, monthly.get(key) + priceOf(job));
  }
  const revenueTrend = [...monthly.entries()].map(([month, value]) => ({
    label: month.slice(5), // "08" — the year is obvious in a 6-month window
    value,
  }));

  // --- jobs -----------------------------------------------------------------
  const overdue = jobs.filter(
    (j) => j.status !== 'delivered' && j.due_date && String(j.due_date).slice(0, 10) < todayIso
  );

  const completionRate = jobs.length
    ? Math.round((delivered.length / jobs.length) * 100)
    : null;

  const averageValue = delivered.length
    ? Math.round(revenueAllTime / delivered.length)
    : null;

  // --- customers ------------------------------------------------------------
  const jobsByCustomer = new Map();
  for (const job of jobs) {
    if (!job.customer_id) continue;
    const entry = jobsByCustomer.get(job.customer_id) || { count: 0, value: 0, last: null };
    entry.count += 1;
    if (job.status === 'delivered') entry.value += priceOf(job);
    const stamp = job.created_at ? new Date(job.created_at).getTime() : 0;
    if (!entry.last || stamp > entry.last) entry.last = stamp;
    jobsByCustomer.set(job.customer_id, entry);
  }

  const returning = [...jobsByCustomer.values()].filter((e) => e.count > 1).length;
  const withAnyJob = jobsByCustomer.size;

  const newInWindow = customers.filter(
    (c) => c.created_at && new Date(c.created_at).getTime() >= since
  ).length;

  const topCustomers = customers
    .map((c) => ({
      label: c.name,
      value: jobsByCustomer.get(c.id)?.value || 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Customers who have gone quiet — the most actionable list on the page, since
  // it is the only one that suggests something to actually do today.
  const quietSince = Date.now() - 90 * DAY_MS;
  const dormant = customers
    .filter((c) => {
      const entry = jobsByCustomer.get(c.id);
      if (!entry) return false;             // never ordered — a different problem
      return entry.last && entry.last < quietSince;
    })
    .map((c) => ({ id: c.id, name: c.name, last: jobsByCustomer.get(c.id).last }))
    .sort((a, b) => a.last - b.last)
    .slice(0, 5);

  return {
    revenue: {
      window: revenueWindow,
      allTime: revenueAllTime,
      trend: revenueTrend,
      averageValue,
    },
    jobs: {
      total: jobs.length,
      active: active.length,
      ready: ready.length,
      delivered: delivered.length,
      overdue: overdue.length,
      completionRate,
      stages: [
        { label: 'cutting', value: jobs.filter((j) => j.status === 'cutting').length },
        { label: 'stitching', value: jobs.filter((j) => j.status === 'stitching').length },
        { label: 'ready', value: ready.length },
        { label: 'delivered', value: delivered.length },
      ],
    },
    customers: {
      total: customers.length,
      newInWindow,
      returning,
      withAnyJob,
      topCustomers,
      dormant,
    },
  };
}
