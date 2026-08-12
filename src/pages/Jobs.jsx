import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Inbox, Loader2, Check, X, RefreshCw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import { jobs as jobsApi, orders as ordersApi } from '../lib/api';
import { useApi, TTL, invalidateCache } from '../hooks/useApi';
import { useJobs, syncNow } from '../hooks/useLocal';
import SyncStatusPill from '../components/SyncStatusPill';
import { useAuth } from '../contexts/AuthContext';

const formatNaira = (n) => (n ? `₦${Number(n).toLocaleString('en-NG')}` : null);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

/**
 * Incoming marketplace order requests (customer → tailor). Accepting converts
 * the order into a job (backend auto-creates it), declining requires a reason
 * that is sent back to the customer.
 */
function IncomingOrders({ onOrderAccepted }) {
  // Ask the backend for PENDING only — the unfiltered list is the latest 20
  // orders of any status, so old pending requests would silently drop out.
  const ordersQ = useApi('orders-incoming-pending', () => ordersApi.listIncoming({ status: 'pending' }), { ttl: TTL.short });
  const [expanded, setExpanded] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [declining, setDeclining] = useState(null); // order id with the reason form open
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  const orders = ordersQ.data?.data?.orders || [];
  const pending = orders.filter((o) => o.status === 'pending');

  const finishAction = () => {
    // Accepting creates a job AND a customer row server-side.
    invalidateCache('orders', 'jobs', 'customers');
    ordersQ.refresh();
  };

  const handleAccept = async (orderId) => {
    setActioning(orderId);
    setActionError('');
    try {
      await ordersApi.accept(orderId);
      finishAction();
      onOrderAccepted?.(); // re-fetch the jobs list below so the new job shows immediately
    } catch (err) {
      setActionError(err.message || 'Could not accept the order. Please try again.');
    }
    setActioning(null);
  };

  const handleDecline = async (orderId) => {
    if (!reason.trim()) return;
    setActioning(orderId);
    setActionError('');
    try {
      await ordersApi.decline(orderId, reason.trim());
      setDeclining(null);
      setReason('');
      finishAction();
    } catch (err) {
      setActionError(err.message || 'Could not decline the order. Please try again.');
    }
    setActioning(null);
  };

  // Nothing pending and nothing failed → stay out of the way.
  if (!ordersQ.loading && !ordersQ.error && pending.length === 0) return null;

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gold-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2 bg-gold-50/60"
      >
        <div className="flex items-center gap-2">
          <Inbox size={17} className="text-gold-600" />
          <span className="text-sm font-heading font-semibold text-gray-900">Order Requests</span>
          {pending.length > 0 && (
            <span className="text-[11px] font-bold bg-gold-500 text-white rounded-full px-2 py-0.5">{pending.length}</span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-3">
          {ordersQ.loading ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
          ) : ordersQ.error ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-500 mb-2">Couldn't load order requests.</p>
              <button onClick={ordersQ.refresh} className="inline-flex items-center gap-1.5 text-xs text-gold-600 font-medium hover:underline">
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          ) : (
            pending.map((order) => (
              <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-2.5">
                  {order.customer_avatar ? (
                    <img src={order.customer_avatar} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: order.customer_avatar_color || '#6366f1' }}>
                      {order.customer_initials || order.customer_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{order.title}</p>
                    <p className="text-xs text-gray-500">from {order.customer_name}</p>
                  </div>
                  {formatNaira(order.budget) && (
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatNaira(order.budget)}</span>
                  )}
                </div>
                {order.description && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-2.5 line-clamp-3">{order.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mb-3">
                  {order.due_date && <span className="flex items-center gap-1"><Calendar size={11} /> Needed by {formatDate(order.due_date)}</span>}
                  {order.fabric_preference && <span>Fabric: {order.fabric_preference}</span>}
                  {Array.isArray(order.reference_images) && order.reference_images.length > 0 && (
                    <span>{order.reference_images.length} reference photo{order.reference_images.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                {declining === order.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Let the customer know why (e.g. fully booked this month)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setDeclining(null); setReason(''); }}
                        className="flex-1 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDecline(order.id)}
                        disabled={!reason.trim() || actioning === order.id}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                          reason.trim() ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {actioning === order.id && <Loader2 size={12} className="animate-spin" />}
                        Confirm Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={actioning === order.id}
                      className="flex-1 py-2.5 bg-gold-500 text-white rounded-xl text-xs font-semibold hover:bg-gold-600 transition flex items-center justify-center gap-1.5"
                    >
                      {actioning === order.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Accept & Start Job
                    </button>
                    <button
                      onClick={() => { setDeclining(order.id); setReason(''); setActionError(''); }}
                      className="px-4 py-2.5 bg-white text-gray-600 rounded-xl text-xs font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
                    >
                      <X size={13} />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          {actionError && <p className="text-xs text-red-500 text-center">{actionError}</p>}
        </div>
      )}
    </div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Local-first: the job list is on the device, so it renders offline and there
  // is no failed-load state to handle. Incoming marketplace orders stay online-
  // only — accepting an order needs the server to arbitrate who got there first.
  const { data: jobs, loading } = useJobs();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Scissors size={22} className="text-gold-500" />
          <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Jobs & Orders</h1>
        </div>
        <SyncStatusPill />
      </div>

      {user?.role === 'tailor' && <IncomingOrders onOrderAccepted={() => syncNow('order-accepted')} />}

      <JobList
        jobs={jobs || []}
        onAddJob={() => navigate('/jobs/new')}
        loading={loading}
      />
    </div>
  );
}
