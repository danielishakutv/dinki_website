import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, MessageCircle, Heart, ChevronLeft, Share2, Image, ShoppingBag, Edit3, Plus, Trash2, Settings, Eye, Loader2, Camera, Move, Check, X, UserPlus, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';
import { useAuth } from '../contexts/AuthContext';
import { storefronts as storefrontsApi, uploads as uploadsApi, users as usersApi } from '../lib/api';
import StorefrontSetupWizard from '../components/StorefrontSetupWizard';

export default function TailorStorefront({ userRole }) {
  const { handle } = useParams();
  const slug = handle;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tailor, setTailor] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const userSlug = user?.storefront_slug || user?.tailor_profile?.storefront_slug;
  const isOwnSlug = user?.role === 'tailor' && slug === userSlug;
  const isOwner = isOwnSlug && !!tailor;
  const previewMode = isOwner && searchParams.get('preview') === 'customer';
  const isEditing = isOwner && !previewMode;
  const isGuest = !user;

  const [activeTab, setActiveTab] = useState('portfolio');
  const [saved, setSaved] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Owner edit states
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkFile, setNewWorkFile] = useState(null);
  const [addingWork, setAddingWork] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Cover image states
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverPosition, setCoverPosition] = useState('center center');
  const [showPositionEditor, setShowPositionEditor] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const coverInputRef = useRef(null);
  const posEditorRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [posY, setPosY] = useState(50); // percentage 0-100

  // Avatar upload states
  const [savingAvatar, setSavingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Guest join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const joinTimerRef = useRef(null);

  // Load storefront data
  const loadStorefront = useCallback(async () => {
    try {
      setLoading(true);
      const res = await storefrontsApi.getBySlug(slug);
      setTailor(res.data);
      setBio(res.data.storefront_bio || res.data.bio || '');
      setPortfolio(res.data.portfolio_preview || []);
    } catch (err) {
      setError(err.message || 'Storefront not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await storefrontsApi.getPortfolio(slug, { limit: 50 });
      if (res.data?.items) setPortfolio(res.data.items);
    } catch { /* use preview from storefront data */ }
  }, [slug]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await storefrontsApi.getReviews(slug, { limit: 20 });
      if (res.data?.reviews) setReviews(res.data.reviews);
    } catch { /* no reviews yet */ }
  }, [slug]);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  // Guest: show join modal after 5 seconds
  useEffect(() => {
    if (isGuest && tailor && !showJoinModal) {
      joinTimerRef.current = setTimeout(() => setShowJoinModal(true), 5000);
    }
    return () => { if (joinTimerRef.current) clearTimeout(joinTimerRef.current); };
  }, [isGuest, tailor]);

  useEffect(() => {
    if (activeTab === 'portfolio' && tailor) loadPortfolio();
    if (activeTab === 'reviews' && tailor) loadReviews();
  }, [activeTab, tailor, loadPortfolio, loadReviews]);

  // Owner actions
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await storefrontsApi.update({ bio: bio.trim() });
      setTailor(prev => ({ ...prev, storefront_bio: bio.trim() }));
      setEditingBio(false);
    } catch { /* ignore */ }
    setSavingBio(false);
  };

  const handleAddWork = async () => {
    if (!newWorkTitle.trim() || !newWorkFile) return;
    if (newWorkFile.size > 800 * 1024) {
      alert('Image must be under 800KB. Please compress it before uploading.');
      return;
    }
    setAddingWork(true);
    try {
      const uploadRes = await uploadsApi.image(newWorkFile);
      const imageUrl = uploadRes.data.url;
      await storefrontsApi.addPortfolio({ title: newWorkTitle.trim(), image_url: imageUrl });
      setShowAddWork(false);
      setNewWorkTitle('');
      setNewWorkFile(null);
      loadPortfolio();
    } catch { /* ignore */ }
    setAddingWork(false);
  };

  const handleRemoveWork = async (itemId) => {
    setRemovingId(itemId);
    try {
      await storefrontsApi.removePortfolio(itemId);
      setPortfolio(prev => prev.filter(p => p.id !== itemId));
    } catch { /* ignore */ }
    setRemovingId(null);
  };

  // Cover image handlers
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert('Image must be under 800KB. Please compress it before uploading.');
      e.target.value = '';
      return;
    }
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
    // Parse current position to get initial Y
    const currentPos = tailor?.cover_image_position || 'center center';
    const yMatch = currentPos.match(/(\d+)%/);
    setPosY(yMatch ? parseInt(yMatch[1]) : 50);
    setShowPositionEditor(true);
  };

  const handlePositionDrag = (e) => {
    if (!posEditorRef.current) return;
    const rect = posEditorRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setPosY(Math.round(pct));
  };

  const handlePositionPointerDown = (e) => {
    e.preventDefault();
    setDragStart(true);
    const onMove = (ev) => {
      ev.preventDefault();
      handlePositionDrag(ev);
    };
    const onUp = () => {
      setDragStart(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const handleSaveCover = async () => {
    if (!coverFile) return;
    setSavingCover(true);
    try {
      const uploadRes = await uploadsApi.image(coverFile);
      const imageUrl = uploadRes.data.url;
      const position = `center ${posY}%`;
      await storefrontsApi.update({ image: imageUrl, cover_position: position });
      setTailor(prev => ({ ...prev, storefront_image: imageUrl, cover_image_position: position }));
      setShowPositionEditor(false);
      setCoverFile(null);
      if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
    } catch { /* ignore */ }
    setSavingCover(false);
  };

  const handleCancelCover = () => {
    setShowPositionEditor(false);
    setCoverFile(null);
    if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null); }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert('Image must be under 800KB. Please compress it before uploading.');
      e.target.value = '';
      return;
    }
    setSavingAvatar(true);
    try {
      const res = await usersApi.updateAvatar(file);
      const newUrl = res.data.avatar_url || res.data.url;
      setTailor(prev => ({ ...prev, avatar_url: newUrl }));
    } catch { /* ignore */ }
    setSavingAvatar(false);
  };

  const shareStorefront = async () => {
    const url = `${window.location.origin}/${slug}`;
    const shareData = {
      title: tailor ? `${tailor.name} — Dinki Africa` : 'Dinki Africa',
      text: tailor ? `Check out ${tailor.name} on Dinki Africa` : 'Check out this tailor on Dinki Africa',
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const formatPrice = (kobo) => {
    if (!kobo) return '—';
    return new Intl.NumberFormat('en-NG').format(kobo / 100);
  };

  // Wizard completion handler
  const handleSetupComplete = (newSlug) => {
    if (newSlug && newSlug !== slug) {
      navigate(`/${newSlug}`, { replace: true });
    } else {
      loadStorefront();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  // Owner needs setup: API error on own slug OR storefront not set up yet
  const needsSetup = isOwnSlug && (!tailor || !tailor.storefront_setup_completed);
  if (needsSetup) {
    return <StorefrontSetupWizard user={user} slug={slug} onComplete={handleSetupComplete} />;
  }

  if (error || !tailor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{error || 'Storefront not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-gold-600 font-medium text-sm">Go back</button>
      </div>
    );
  }

  const displayImage = tailor.storefront_image || tailor.avatar_url;
  const displayBio = tailor.storefront_bio || tailor.bio || '';
  const displayLocation = [tailor.location_city, tailor.location_state].filter(Boolean).join(', ');
  const coverPos = tailor.cover_image_position || 'center center';

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="sticky top-0 z-40 bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Eye size={15} />
            <span className="font-medium">Viewing as customer</span>
          </div>
          <button
            onClick={() => navigate(`/${slug}`)}
            className="text-sm font-medium bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition"
          >
            Exit Preview
          </button>
        </div>
      )}

      {/* Position Editor Modal */}
      {showPositionEditor && coverPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-xl">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-heading font-semibold text-gray-800">Adjust Cover Position</h3>
              <p className="text-xs text-gray-400">Drag image up or down</p>
            </div>
            <div
              ref={posEditorRef}
              className="relative h-56 sm:h-64 overflow-hidden cursor-ns-resize select-none"
              onMouseDown={handlePositionPointerDown}
              onTouchStart={handlePositionPointerDown}
            >
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-full object-cover pointer-events-none"
                style={{ objectPosition: `center ${posY}%` }}
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Move size={13} />
                  Drag to reposition
                </div>
              </div>
            </div>
            <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={handleCancelCover}
                className="flex-1 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl flex items-center justify-center gap-1.5"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSaveCover}
                disabled={savingCover}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gold-500 rounded-xl flex items-center justify-center gap-1.5 hover:bg-gold-600 transition"
              >
                {savingCover ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {savingCover ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Image + Info */}
      <div className="relative h-56 sm:h-60 md:h-72 bg-gradient-to-br from-indigo-900 to-indigo-800 overflow-hidden">
        {displayImage && (
          <img
            src={displayImage}
            alt={tailor.name}
            className="w-full h-full object-cover opacity-30"
            style={{ objectPosition: coverPos }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Cover upload button (owner only) */}
        {isEditing && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-20 right-4 sm:bottom-24 sm:right-5 z-10 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
              title="Change cover image"
            >
              <Camera size={16} className="text-white" />
            </button>
          </>
        )}

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <button
                onClick={() => navigate('/profile')}
                className="h-10 px-4 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <Settings size={15} className="text-white" />
                <span className="text-white text-sm font-medium">Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setSaved(!saved)}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart size={18} className={saved ? 'text-red-400 fill-red-400' : 'text-white'} />
              </button>
            )}
            <button
              onClick={shareStorefront}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center relative"
            >
              <Share2 size={18} className="text-white" />
              {showCopied && (
                <span className="absolute -bottom-8 right-0 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tailor info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="flex items-end gap-4">
            <div className="relative flex-shrink-0">
              {tailor.avatar_url ? (
                <img src={tailor.avatar_url} alt={tailor.name} className="w-18 h-18 md:w-22 md:h-22 rounded-2xl object-cover ring-3 ring-white shadow-lg" style={{ width: '4.5rem', height: '4.5rem' }} />
              ) : (
                <div
                  className={`rounded-2xl ring-3 ring-white shadow-lg flex items-center justify-center text-white font-bold text-xl relative overflow-hidden${isEditing ? ' cursor-pointer' : ''}`}
                  style={{ width: '4.5rem', height: '4.5rem', backgroundColor: tailor.avatar_color || '#6366f1' }}
                  onClick={isEditing ? () => avatarInputRef.current?.click() : undefined}
                >
                  {tailor.initials || tailor.name?.charAt(0)}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                      <Camera size={14} className="text-white" />
                      <span className="text-[8px] text-white/90 font-medium mt-0.5">Logo</span>
                    </div>
                  )}
                </div>
              )}
              {isEditing && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={savingAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center ring-2 ring-white shadow-sm hover:bg-gold-600 transition"
                    title="Upload store logo"
                  >
                    {savingAvatar ? <Loader2 size={11} className="text-white animate-spin" /> : <Camera size={11} className="text-white" />}
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0 mb-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white truncate">{tailor.name}</h1>
                {tailor.verified && <VerifiedBadge size={18} />}
                <LevelBadge completedOrders={tailor.completed_jobs} />
              </div>
              <p className="text-white/70 text-sm md:text-base">{(tailor.specialties || []).slice(0, 2).join(' · ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Star size={14} className="text-yellow-400" fill="currentColor" />
            <span className="text-base font-bold text-gray-900">{tailor.rating_avg || '—'}</span>
          </div>
          <p className="text-xs text-gray-400">{tailor.rating_count || 0} reviews</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gray-900">{tailor.completed_jobs || 0}</p>
          <p className="text-xs text-gray-400">Jobs done</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gray-900">{tailor.response_time || '—'}</p>
          <p className="text-xs text-gray-400">Response</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-base font-bold text-gold-600">{tailor.start_price ? `₦${formatPrice(tailor.start_price)}` : '—'}</p>
          <p className="text-xs text-gray-400">Starting</p>
        </div>
      </div>

      {/* Bio + Specialties */}
      <div className="px-5 mt-5 space-y-4">
        {isEditing && editingBio ? (
          <div className="space-y-3">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setEditingBio(false); setBio(displayBio); }} className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleSaveBio} disabled={savingBio} className="px-4 py-2.5 text-sm font-semibold text-white bg-gold-500 rounded-xl flex items-center gap-2">
                {savingBio && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <p className="text-sm text-gray-600 leading-relaxed pr-8">{displayBio || 'No bio yet.'}</p>
            {isEditing && (
              <button onClick={() => setEditingBio(true)} className="absolute top-0 right-0 w-7 h-7 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition md:opacity-100">
                <Edit3 size={12} className="text-gold-600" />
              </button>
            )}
          </div>
        )}
        {displayLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={15} className="flex-shrink-0 text-gray-400" />
            <span>{displayLocation}</span>
          </div>
        )}
        {tailor.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tailor.specialties.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-medium border border-gold-100">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-5 mt-6 flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={shareStorefront}
              className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2 relative"
            >
              <Share2 size={16} />
              Share My Storefront
              {showCopied && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] bg-black/80 text-white px-2.5 py-1 rounded-lg whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (params.get('preview') === 'customer') {
                  navigate(`/${slug}`);
                } else {
                  navigate(`/${slug}?preview=customer`);
                }
              }}
              className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </>
        ) : previewMode ? (
          <>
            <button
              disabled
              className="flex-1 py-3.5 bg-gray-300 text-gray-500 rounded-xl text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Place Order
            </button>
            <button
              disabled
              className="px-5 py-3.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium border border-gray-200 cursor-not-allowed flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Chat
            </button>
          </>
        ) : isGuest ? (
          <>
            <button
              onClick={() => navigate('/onboarding')}
              className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              Sign Up to Order
            </button>
            <button
              onClick={shareStorefront}
              className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2 relative"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
              {showCopied && (
                <span className="absolute -top-9 right-0 text-[10px] bg-black/80 text-white px-2.5 py-1 rounded-lg whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate(`/order/new?tailor=${tailor.tailor_id}&slug=${slug}`)}
              className="flex-1 py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Place Order
            </button>
            <button
              onClick={() => navigate(`/messages/${tailor.tailor_id}`)}
              className="px-5 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Chat
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2.5 mt-7 px-5">
        {[
          { id: 'portfolio', label: 'Catalogue', icon: Image },
          { id: 'reviews', label: 'Reviews', icon: Star },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 mt-5"
          >
            {isEditing && (
              <div className="mb-4">
                {!showAddWork ? (
                  <button
                    onClick={() => setShowAddWork(true)}
                    className="w-full py-3.5 bg-white rounded-xl border-2 border-dashed border-gold-300 text-sm font-medium text-gold-600 hover:bg-gold-50 transition flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add to Catalogue
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-4 border border-gold-200 space-y-3">
                    <h4 className="text-sm font-heading font-semibold text-gray-800">Add Catalogue Item</h4>
                    <input
                      value={newWorkTitle}
                      onChange={(e) => setNewWorkTitle(e.target.value)}
                      placeholder="Work title (e.g. Ankara Gown)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                    />
                    <label className="flex items-center justify-center h-28 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gold-300 transition">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewWorkFile(e.target.files[0])} />
                      <div className="text-center">
                        <Image size={24} className="mx-auto text-gray-300 mb-1.5" />
                        <p className="text-xs text-gray-400">{newWorkFile ? newWorkFile.name : 'Tap to upload photo'}</p>
                      </div>
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowAddWork(false); setNewWorkTitle(''); setNewWorkFile(null); }} className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200">Cancel</button>
                      <button
                        onClick={handleAddWork}
                        disabled={addingWork || !newWorkTitle.trim() || !newWorkFile}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${newWorkTitle.trim() && newWorkFile ? 'bg-gold-500 text-white hover:bg-gold-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        {addingWork && <Loader2 size={14} className="animate-spin" />}
                        Add Work
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.map(work => (
                <div key={work.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    <img src={work.image_url} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {work.rating > 0 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg">
                        <Star size={10} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[11px] font-bold">{work.rating}</span>
                      </div>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveWork(work.id)}
                        disabled={removingId === work.id}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-100 transition"
                      >
                        {removingId === work.id ? <Loader2 size={13} className="text-white animate-spin" /> : <Trash2 size={13} className="text-white" />}
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{work.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-5 mt-5 space-y-3"
          >
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-5">
              <div className="text-center">
                <p className="text-3xl font-heading font-bold text-gray-900">{tailor.rating_avg || '—'}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={12} className="text-yellow-400" fill={i <= Math.round(tailor.rating_avg || 0) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{tailor.rating_count || 0} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(stars => {
                  const count = reviews.filter(r => r.rating === stars).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{stars}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {reviews.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No reviews yet.</p>
              </div>
            )}

            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    {review.customer_avatar ? (
                      <img src={review.customer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: (review.customer_avatar_color || '#f3e8d0'), color: review.customer_avatar_color ? '#fff' : '#92700a' }}>
                        {review.customer_initials || review.customer_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{review.customer_name}</p>
                      <p className="text-xs text-gray-400">{review.created_at ? new Date(review.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={11} className="text-yellow-400" fill={i <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Join Modal */}
      <AnimatePresence>
        {showJoinModal && isGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Close button */}
              <div className="flex justify-end px-4 pt-2 sm:pt-4">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="px-6 pb-6 pt-1 text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={26} className="text-gold-500" />
                </div>

                <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">
                  Join Dinki Africa
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  Create a free account to order from {tailor?.name || 'this tailor'} and thousands more.
                </p>

                {/* Benefits */}
                <div className="space-y-3 text-left mb-6">
                  {[
                    { icon: ShoppingBag, text: 'Place orders with trusted tailors' },
                    { icon: MessageCircle, text: 'Chat directly with your tailor' },
                    { icon: Shield, text: 'Secure payments & order tracking' },
                    { icon: Clock, text: 'Real-time delivery updates' },
                    { icon: Users, text: 'Join a growing community of fashion lovers' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-gold-600" />
                      </div>
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate('/onboarding')}
                  className="w-full py-3.5 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  Create Free Account
                </button>

                <p className="text-xs text-gray-400 mt-3">
                  Already have an account?
                  <button onClick={() => navigate('/onboarding')} className="text-gold-600 font-medium ml-1 hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
