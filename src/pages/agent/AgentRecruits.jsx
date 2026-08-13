import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Send, Check, Copy, Loader2, UserPlus } from 'lucide-react';
import { agents as agentsApi } from '../../lib/api';
import { useApi, TTL, invalidateCache } from '../../hooks/useApi';

/**
 * Everyone the agent has brought in.
 *
 * The list leads with who still hasn't finished setting up, because that is the
 * only thing on this page the agent can act on — a resend or a WhatsApp nudge
 * turns a dead registration into a real user.
 */

const FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'pending', label: 'Not set up' },
  { value: 'claimed', label: 'Set up' },
];

function Row({ recruit, onResend, busy, resentLink }) {
  const pending = recruit.account_status === 'inactive';

  return (
    <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-bold text-xs shrink-0"
        style={{ backgroundColor: recruit.avatar_color || '#D4A574' }}
      >
        {recruit.initials || recruit.name?.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{recruit.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-400 capitalize">{recruit.role}</span>
          {recruit.source === 'direct' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              You registered
            </span>
          )}
          {recruit.location_state && (
            <span className="text-[11px] text-gray-300">{recruit.location_state}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {pending ? (
          <>
            <span className="block text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium mb-1.5">
              Not set up
            </span>
            {recruit.source === 'direct' && (
              <button
                onClick={() => onResend(recruit)}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-600 hover:underline disabled:opacity-50"
              >
                {busy ? <Loader2 size={11} className="animate-spin" /> : resentLink ? <Check size={11} /> : <Send size={11} />}
                {resentLink ? 'Sent' : 'Resend link'}
              </button>
            )}
          </>
        ) : (
          <span className="block text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
            Active
          </span>
        )}
      </div>
    </div>
  );
}

export default function AgentRecruits() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [resent, setResent] = useState({});

  const { data: res, loading } = useApi(
    `agent-recruits-${status || 'all'}`,
    () => agentsApi.recruits({ limit: 100, status: status || undefined }),
    { ttl: TTL.medium }
  );

  const recruits = Array.isArray(res?.data) ? res.data : [];

  const handleResend = async (recruit) => {
    setBusyId(recruit.id);
    try {
      const out = await agentsApi.resendClaim(recruit.id);
      setResent((prev) => ({ ...prev, [recruit.id]: out.data?.claim_link || true }));
      invalidateCache('agent-recruits');
      // Put the fresh link on the clipboard too — the agent almost always wants
      // to paste it into WhatsApp, and the email may never arrive.
      if (out.data?.claim_link) {
        navigator.clipboard.writeText(out.data.claim_link).catch(() => {});
      }
    } catch {
      /* the row simply stays actionable */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4 pb-24 md:pb-8">
      <button
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gold-500" />
          <h1 className="text-xl font-heading font-bold text-gray-900">Your people</h1>
        </div>
        <button
          onClick={() => navigate('/agent/register')}
          className="btn-touch px-3 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-white transition inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <UserPlus size={16} /> Add
        </button>
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              status === f.value
                ? 'bg-gold-500 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && !recruits.length ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold-500" />
        </div>
      ) : recruits.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 mb-3">
            {status ? 'Nobody in this group yet.' : "You haven't registered anyone yet."}
          </p>
          {!status && (
            <button
              onClick={() => navigate('/agent/register')}
              className="text-sm font-medium text-gold-600 hover:underline"
            >
              Register your first person
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {recruits.map((r) => (
            <Row
              key={r.id}
              recruit={r}
              onResend={handleResend}
              busy={busyId === r.id}
              resentLink={resent[r.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
