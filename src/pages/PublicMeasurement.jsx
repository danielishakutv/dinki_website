import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ruler, Loader2, Eye, ScrollText } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { measurementShares as sharesApi } from '../lib/api';

const LABELS = {
  neck: 'Neck', shoulder: 'Shoulder', chest: 'Chest', bust: 'Bust', waist: 'Waist',
  hip: 'Hip', sleeve: 'Sleeve Length', arm: 'Arm Length', wrist: 'Wrist', thigh: 'Thigh',
  knee: 'Knee', inseam: 'Inseam', outseam: 'Outseam', ankle: 'Ankle',
  full_length: 'Full Length', round_body: 'Round Body',
};

export default function PublicMeasurement() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    sharesApi.viewPublic(token)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.message || 'This measurement link is unavailable.'))
      .finally(() => setLoading(false));
  }, [token]);

  const ownerInitials = data?.owner?.initials
    || (data?.owner?.name ? data.owner.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?');

  const standard = data?.measurements?.standard || {};
  const custom = data?.measurements?.custom || [];
  const notes = data?.measurements?.notes;
  const entries = Object.entries(standard).filter(([, v]) => v !== '' && v != null);

  return (
    <div className="min-h-screen bg-cloud">
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Link to="/?auth=signup" className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gold-500 hover:bg-gold-600 transition">Join Dinki</Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-gold-500" /></div>
        ) : error ? (
          <div className="text-center py-20">
            <Ruler size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{error}</p>
            <Link to="/" className="mt-3 inline-block text-gold-600 font-medium text-sm">Go to Dinki</Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-gold-500 to-amber-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-heading font-bold">
                    {ownerInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/80">Measurements shared by</p>
                    <p className="font-heading font-bold text-lg truncate">{data.owner?.name || 'A Dinki user'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <h1 className="text-xl font-heading font-bold">{data.title}</h1>
                  <span className="flex items-center gap-1 text-xs text-white/80"><Eye size={13} /> {data.view_count}</span>
                </div>
              </div>

              <div className="p-5">
                {entries.length === 0 && custom.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No measurements recorded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {entries.map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                        <p className="text-[11px] text-gray-400">{LABELS[key] || key.replace(/_/g, ' ')}</p>
                        <p className="text-base font-heading font-bold text-gray-900">{value}<span className="text-xs font-normal text-gray-400 ml-0.5">{data.unit}</span></p>
                      </div>
                    ))}
                    {custom.map((c, i) => (
                      <div key={`c-${i}`} className="rounded-xl border border-gold-100 bg-gold-50/60 px-3 py-2.5">
                        <p className="text-[11px] text-gray-400">{c.label}</p>
                        <p className="text-base font-heading font-bold text-gray-900">{c.value}<span className="text-xs font-normal text-gray-400 ml-0.5">{c.unit || data.unit}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {notes && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1"><ScrollText size={13} /> Notes for the tailor</p>
                    <p className="text-sm text-amber-900/80 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Want your own shareable measurements?</p>
              <Link to="/?auth=signup" className="mt-2 inline-block px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition">Create your free Dinki link</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
