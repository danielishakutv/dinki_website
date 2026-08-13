import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Loader2, Check, Copy, MessageCircle, AlertCircle } from 'lucide-react';
import { agents as agentsApi } from '../../lib/api';
import { invalidateCache } from '../../hooks/useApi';

/**
 * Register a person on the spot.
 *
 * The agent never sets a password. Submitting creates an inactive account and a
 * single-use claim link, which the person uses to choose their own password. So
 * an agent who leaves — or whose own account is compromised — has no standing
 * access to anyone they signed up.
 *
 * The success screen leads with the WhatsApp hand-off rather than a tidy
 * confirmation, because email and SMS both fail quietly in this market and the
 * agent is usually standing right next to the person.
 */
export default function AgentRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'tailor' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Enter a phone number or an email address.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await agentsApi.register({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        role: form.role,
      });
      invalidateCache('agent-stats', 'agent-recruits');
      setDone(res.data);
    } catch (err) {
      setError(err.message || 'Could not register this person');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!done?.claim_link) return;
    navigator.clipboard.writeText(done.claim_link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const whatsappHref = () => {
    const text = `Hi ${done?.name || ''}, here's your Dinki account. Tap to set your password: ${done?.claim_link}`;
    const phone = String(done?.phone || '').replace(/^\+/, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const registerAnother = () => {
    setDone(null);
    setForm({ name: '', phone: '', email: '', role: 'tailor' });
  };

  if (done) {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto space-y-5 pb-24 md:pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Check size={22} className="text-emerald-600" />
          </div>
          <h1 className="font-heading font-bold text-lg text-gray-900">{done.name} is registered</h1>
          <p className="text-sm text-gray-500 mt-1">
            Now send them this link so they can set their password.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          {done.phone && (
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition"
            >
              <MessageCircle size={17} /> Send on WhatsApp
            </a>
          )}

          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>

          <p className="text-[11px] text-gray-400 break-all leading-relaxed pt-1">{done.claim_link}</p>
          <p className="text-[11px] text-gray-400">
            We also emailed and texted it where we could. The link works once and expires in 30 days.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={registerAnother}
            className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-medium text-sm transition"
          >
            Register another
          </button>
          <button
            onClick={() => navigate('/agent/recruits')}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
          >
            See everyone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto space-y-5 pb-24 md:pb-8">
      <button
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center gap-2">
        <UserPlus size={20} className="text-gold-500" />
        <h1 className="text-xl font-heading font-bold text-gray-900">Register someone</h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">They are a *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'tailor', label: 'Tailor / maker' },
              { value: 'customer', label: 'Customer' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('role', opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                  form.role === opt.value
                    ? 'bg-gold-50 border-gold-400 text-gold-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Amina Bello"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone number</label>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="0801 234 5678"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Email <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            A phone number or an email — either is enough.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium text-sm transition inline-flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {saving ? 'Registering…' : 'Register & get link'}
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          They choose their own password from the link — you never set it for them.
        </p>
      </form>
    </div>
  );
}
