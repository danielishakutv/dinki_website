import { getDb, SYNC_STATE } from './db';
import { uuid } from './ids';
import { enqueue } from './outbox';
import { scheduleSync } from './sync';

/**
 * The repository layer — the only thing the UI talks to.
 *
 * Every read resolves from IndexedDB and every write commits to IndexedDB before
 * returning. Nothing here awaits the network, so a save takes the same few
 * milliseconds whether the phone is on fibre or has no signal at all. The outbox
 * and the sync engine deal with getting it to the server, eventually.
 */

function initialsFor(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const customersRepo = {
  async list({ search } = {}) {
    const db = getDb();
    let rows = await db.customers.where('_deleted').equals(0).toArray();
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((c) =>
        [c.name, c.phone, c.email].some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  },

  async get(id) {
    const db = getDb();
    const row = await db.customers.get(id);
    return row && !row._deleted ? row : null;
  },

  async create(data) {
    const db = getDb();
    const id = uuid();
    const name = String(data.name || '').trim();

    // The record is complete and permanent the moment it's written locally. Its
    // id is final, so a job can reference it immediately — before the server has
    // any idea it exists.
    const record = {
      id,
      name,
      phone: data.phone || null,
      email: data.email || null,
      location: data.location || null,
      initials: initialsFor(name),
      avatar_color: randomColor(),
      measurements: { _version: 1, standard: {}, custom: [] },
      measurement_notes: null,
      custom_fields: [],
      created_at: nowIso(),
      updated_at: nowIso(),
      _deleted: 0,
      _syncState: SYNC_STATE.PENDING,
      _syncedAt: null,
    };

    await db.customers.put(record);
    await enqueue({
      entity: 'customer',
      op: 'create',
      entityId: id,
      patch: { name, phone: record.phone, email: record.email, location: record.location },
    });
    scheduleSync('customer.create');
    return record;
  },

  async update(id, patch) {
    const db = getDb();
    const clean = {};
    for (const key of ['name', 'phone', 'email', 'location']) {
      if (patch[key] !== undefined) clean[key] = patch[key];
    }
    if (!Object.keys(clean).length) return this.get(id);

    if (clean.name) clean.initials = initialsFor(clean.name);

    await db.customers.update(id, {
      ...clean,
      updated_at: nowIso(),
      _syncState: SYNC_STATE.PENDING,
    });
    // `initials` is derived server-side, so it isn't part of the patch we upload.
    const { initials, ...uploadable } = clean;
    await enqueue({ entity: 'customer', op: 'update', entityId: id, patch: uploadable });
    scheduleSync('customer.update');
    return this.get(id);
  },

  async saveMeasurements(id, values) {
    const db = getDb();
    const existing = await db.customers.get(id);
    if (!existing) return null;

    const current = existing.measurements || { _version: 0, standard: {}, custom: [] };
    const standard = {};
    const reserved = ['_version', '_custom', 'notes', 'standard', 'custom'];
    for (const [key, value] of Object.entries(values)) {
      if (!reserved.includes(key) && value != null && value !== '') {
        standard[key] = Number(value) || 0;
      }
    }

    const measurements = {
      _version: (current._version || 0) + 1,
      standard,
      custom: Array.isArray(values._custom) ? values._custom : current.custom || [],
    };
    if (values.notes !== undefined) measurements.notes = values.notes;

    await db.customers.update(id, {
      measurements,
      measurement_notes: values.notes ?? existing.measurement_notes,
      updated_at: nowIso(),
      _syncState: SYNC_STATE.PENDING,
    });

    // Measurements upload as one blob rather than per-field. A body measurement
    // set is taken in a single sitting by a single person, so there is no
    // realistic concurrent-edit case to merge — and the server rebuilds the
    // whole object anyway.
    await enqueue({ entity: 'customer', op: 'measurements', entityId: id, patch: values });
    scheduleSync('customer.measurements');
    return this.get(id);
  },

  async remove(id) {
    const db = getDb();
    await db.customers.update(id, { _deleted: 1, _syncState: SYNC_STATE.PENDING });
    await enqueue({ entity: 'customer', op: 'delete', entityId: id, patch: {} });
    scheduleSync('customer.delete');
  },

  /**
   * Store a record the server just created, without queuing anything.
   *
   * Used by the online "add customer" path, which still goes through the API so
   * the tailor gets identity matching — that check searches every platform user
   * and simply cannot be done on-device. Writing the result straight in means
   * the customer list shows it immediately instead of waiting for the next pull.
   */
  async adoptServerRecord(record) {
    if (!record?.id) return null;
    const db = getDb();
    await db.customers.put({
      ...record,
      _deleted: record.deleted_at ? 1 : 0,
      _syncState: SYNC_STATE.SYNCED,
      _syncedAt: Date.now(),
    });
    return this.get(record.id);
  },
};

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

const STATUS_ORDER = ['cutting', 'stitching', 'ready', 'delivered'];

export const jobsRepo = {
  /**
   * Jobs joined to their customer locally. The server could denormalise these
   * fields into the sync payload, but joining on-device keeps the sync smaller —
   * which is the currency that matters on a 2G link.
   */
  async list({ status, search, customerId, overdue } = {}) {
    const db = getDb();
    let rows = await db.jobs.where('_deleted').equals(0).toArray();

    if (status) rows = rows.filter((j) => j.status === status);
    if (customerId) rows = rows.filter((j) => j.customer_id === customerId);
    if (overdue) {
      const today = new Date().toISOString().slice(0, 10);
      rows = rows.filter((j) => j.due_date && j.due_date.slice(0, 10) < today && j.status !== 'delivered');
    }

    const customers = await db.customers.toArray();
    const byId = new Map(customers.map((c) => [c.id, c]));

    let joined = rows.map((job) => {
      const customer = byId.get(job.customer_id);
      return {
        ...job,
        customer_name: customer?.name || null,
        customer_initials: customer?.initials || null,
        customer_avatar_color: customer?.avatar_color || null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      joined = joined.filter((j) =>
        [j.title, j.customer_name].some((v) => String(v || '').toLowerCase().includes(q))
      );
    }

    return joined.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  },

  async get(id) {
    const db = getDb();
    const job = await db.jobs.get(id);
    if (!job || job._deleted) return null;
    const customer = job.customer_id ? await db.customers.get(job.customer_id) : null;
    return {
      ...job,
      customer_name: customer?.name || null,
      customer_phone: customer?.phone || null,
      customer_email: customer?.email || null,
      customer_initials: customer?.initials || null,
      customer_avatar_color: customer?.avatar_color || null,
    };
  },

  async create(data) {
    const db = getDb();
    const id = uuid();
    const record = {
      id,
      customer_id: data.customer_id,
      title: String(data.title || '').trim(),
      description: data.description || null,
      style_image_url: data.style_image_url || null,
      status: 'cutting',
      due_date: data.due_date || null,
      price: data.price ?? null,
      invoiced: false,
      invoiced_at: null,
      delivered_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      _deleted: 0,
      _syncState: SYNC_STATE.PENDING,
      _syncedAt: null,
    };

    await db.jobs.put(record);
    await enqueue({
      entity: 'job',
      op: 'create',
      entityId: id,
      patch: {
        customer_id: record.customer_id,
        title: record.title,
        description: record.description,
        style_image_url: record.style_image_url,
        due_date: record.due_date,
        price: record.price,
      },
    });
    scheduleSync('job.create');
    return record;
  },

  async update(id, patch) {
    const db = getDb();
    const clean = {};
    for (const key of ['title', 'description', 'style_image_url', 'due_date', 'price']) {
      if (patch[key] !== undefined) clean[key] = patch[key];
    }
    if (!Object.keys(clean).length) return this.get(id);

    await db.jobs.update(id, { ...clean, updated_at: nowIso(), _syncState: SYNC_STATE.PENDING });
    await enqueue({ entity: 'job', op: 'update', entityId: id, patch: clean });
    scheduleSync('job.update');
    return this.get(id);
  },

  /**
   * Move a job to any stage, in either direction — the tailor owns the workshop,
   * so a mistap or a garment that comes back for adjustment is just another
   * status change. Mirrors the server rule locally so the device and the server
   * agree once the phone syncs.
   */
  async setStatus(id, nextStatus) {
    const db = getDb();
    const job = await db.jobs.get(id);
    if (!job) return null;

    if (!STATUS_ORDER.includes(nextStatus)) {
      const err = new Error(`Unknown status "${nextStatus}"`);
      err.code = 'INVALID_STATUS';
      throw err;
    }
    // Already there — no local write, and no op the server would have to
    // no-op its way through later.
    if (job.status === nextStatus) return job;

    await db.jobs.update(id, {
      status: nextStatus,
      // Cleared when the job leaves delivered, so the local revenue figures
      // stop counting a job that is back on the bench — same rule as the server.
      delivered_at: nextStatus === 'delivered' ? nowIso() : null,
      updated_at: nowIso(),
      _syncState: SYNC_STATE.PENDING,
    });
    // Deliberately never coalesced — see outbox.NON_COALESCING.
    await enqueue({ entity: 'job', op: 'status', entityId: id, patch: { status: nextStatus } });
    scheduleSync('job.status');
    return this.get(id);
  },

  /** Payment lands whenever it lands — deposit at cutting, balance on delivery. */
  async setInvoiced(id, invoiced) {
    const db = getDb();
    const job = await db.jobs.get(id);
    if (!job) return null;

    await db.jobs.update(id, {
      invoiced,
      invoiced_at: invoiced ? nowIso() : null,
      updated_at: nowIso(),
      _syncState: SYNC_STATE.PENDING,
    });
    await enqueue({ entity: 'job', op: 'invoice', entityId: id, patch: { invoiced } });
    scheduleSync('job.invoice');
    return this.get(id);
  },

  async remove(id) {
    const db = getDb();
    await db.jobs.update(id, { _deleted: 1, _syncState: SYNC_STATE.PENDING });
    await enqueue({ entity: 'job', op: 'delete', entityId: id, patch: {} });
    scheduleSync('job.delete');
  },

  /** Dashboard figures, computed locally so they're correct offline too. */
  async stats() {
    const db = getDb();
    const rows = (await db.jobs.where('_deleted').equals(0).toArray());
    const sum = (list) => list.reduce((total, j) => total + (Number(j.price) || 0), 0);

    const delivered = rows.filter((j) => j.status === 'delivered');
    const readyUninvoiced = rows.filter((j) => j.status === 'ready' && !j.invoiced);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return {
      activeCount: rows.filter((j) => j.status === 'cutting' || j.status === 'stitching').length,
      pendingInvoices: readyUninvoiced.length,
      pendingInvoiceValue: sum(readyUninvoiced),
      totalRevenue: sum(delivered),
      monthlyRevenue: sum(
        delivered.filter((j) => j.delivered_at && new Date(j.delivered_at) >= startOfMonth)
      ),
      deliveredCount: delivered.length,
    };
  },
};
