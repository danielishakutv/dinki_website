import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImagePlus, Loader2, X, Check, Rocket, AlertCircle, Tag as TagIcon, Store, Globe, Sparkles,
} from 'lucide-react';
import { uploads as uploadsApi, storefronts as storefrontsApi, styles as stylesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  'agbada', 'ankara', 'aso-ebi', 'kaftan', 'lace', 'bridal', 'corporate', 'native',
  'traditional', 'casual', 'senator', 'wrapper & blouse', 'accessories', 'materials',
];

const MAX_BYTES = 800 * 1024;

export default function AddStyle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTailor = role === 'tailor';

  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  // Admin-only source attribution
  const [sourceType, setSourceType] = useState('admin'); // 'admin' | 'external'
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) { setError('Image must be under 800KB. Please compress it first.'); return; }
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const clearImage = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const canSubmit = file && title.trim().length >= 2 && !saving;

  const submit = async () => {
    if (!file) { setError('Please choose an image.'); return; }
    if (title.trim().length < 2) { setError('Please add a title.'); return; }
    setSaving(true);
    setError('');
    try {
      const up = await uploadsApi.image(file);
      const image_url = up.data.url;
      const thumb_url = up.data.thumbnail || up.data.url;

      const tags = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 20);
      const priceKobo = price ? Math.round(parseFloat(price) * 100) : undefined;
      const base = {
        title: title.trim(),
        image_url,
        thumb_url,
        category: category || undefined,
        tags: tags.length ? tags : undefined,
        description: description.trim() || undefined,
        price: priceKobo,
      };

      if (isAdmin) {
        const res = await stylesApi.create({
          ...base,
          source_type: sourceType,
          source_name: sourceName.trim() || undefined,
          source_url: sourceUrl.trim() || undefined,
        });
        navigate(`/style/${res.data.id}`);
      } else {
        // Tailor — adds to their storefront AND mirrors into the public feed.
        const res = await storefrontsApi.addPortfolio(base);
        navigate(res.data?.style_id ? `/style/${res.data.style_id}` : '/explore?sort=recent');
      }
    } catch (err) {
      setError(err.message || 'Could not publish. Please try again.');
      setSaving(false);
    }
  };

  if (!isTailor && !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles size={28} className="mx-auto text-gold-400 mb-3" />
        <h1 className="text-xl font-heading font-bold text-gray-900">Publishing is for tailors</h1>
        <p className="text-sm text-gray-500 mt-2">Browse and save styles you love — when you join as a tailor you can publish your own work to the feed.</p>
        <button onClick={() => navigate('/explore')} className="mt-4 px-5 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold">Back to Explore</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <ImagePlus size={22} className="text-gold-500" />
        <h1 className="text-2xl font-heading font-bold text-gray-900">Add a Style</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {isTailor
          ? 'Publish your work — it appears on your storefront and in the public Explore feed.'
          : 'Curate a style for the public Explore feed.'}
      </p>

      {/* Image */}
      {!preview ? (
        <label className="flex flex-col items-center justify-center h-56 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-300 hover:bg-gold-50/30 transition">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <ImagePlus size={30} className="text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-500">Upload a photo</p>
          <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG or WebP · under 800KB</p>
        </label>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={preview} alt="preview" className="w-full max-h-[28rem] object-cover" />
          <button onClick={clearImage} className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="space-y-4 mt-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
            placeholder="e.g. Royal Embroidered Agbada"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(category === c ? '' : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1"><TagIcon size={12} /> Tags</label>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
            placeholder="comma separated, e.g. wedding, gold, embroidery"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000}
            placeholder="Tell people about this look…"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Starting price <span className="text-gray-300 font-normal">(optional)</span></label>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20">
            <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 font-medium select-none">&#x20A6;</span>
            <input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} min="0"
              placeholder="e.g. 15,000" className="flex-1 px-3 py-2.5 text-sm focus:outline-none min-w-0" />
          </div>
        </div>

        {isAdmin && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500">Source (admin)</p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
              <button onClick={() => setSourceType('admin')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${sourceType === 'admin' ? 'bg-gold-500 text-white' : 'text-gray-500'}`}><Store size={13} /> Curated</button>
              <button onClick={() => setSourceType('external')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${sourceType === 'external' ? 'bg-gold-500 text-white' : 'text-gray-500'}`}><Globe size={13} /> From the web</button>
            </div>
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Source name (e.g. brand / site)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-400" />
            {sourceType === 'external' && (
              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Original link (https://…)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-400" />
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button onClick={submit} disabled={!canSubmit}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition ${canSubmit ? 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Publishing…</> : <><Rocket size={16} /> {isTailor ? 'Publish to storefront & feed' : 'Publish to feed'}</>}
        </button>
      </div>
    </div>
  );
}
