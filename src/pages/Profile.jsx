import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Edit3, Star, Scissors, Briefcase, Calendar, X, Plus, Trash2, Loader2, AtSign, Check, AlertCircle } from 'lucide-react';
import { users as usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Profile({ userRole }) {
  const { user: authUser } = useAuth();
  const isTailor = userRole === 'tailor' || authUser?.role === 'tailor';
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newSpecialty, setNewSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [settingUsername, setSettingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [showUsernameForm, setShowUsernameForm] = useState(false);

  const { data: profileRes, loading: profileLoading, refresh: refreshProfile } = useApi(
    'profile', () => usersApi.getProfile(), { ttl: TTL.long }
  );
  const { data: statsRes, loading: statsLoading } = useApi(
    'profile-stats', () => usersApi.getStats().catch(() => ({ data: {} })), { ttl: TTL.long }
  );

  const loading = profileLoading || statsLoading;
  const p = profileRes?.data || {};
  const s = statsRes?.data || {};

  const loc = [p.location_city, p.location_state, p.location_country].filter(Boolean).join(', ') || p.location || '';
  const profile = p.id ? {
    name: p.business_name || p.name || '',
    role: isTailor ? (p.title || 'Tailor') : 'Customer',
    initials: getInitials(p.business_name || p.name || '??'),
    avatar_color: p.avatar_color || '#D4A574',
    avatar_url: p.avatar_url,
    email: p.email || '',
    phone: p.phone || '',
    location: loc,
    bio: p.bio || '',
    joined: new Date(p.created_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
    specialties: p.specialties || [],
    raw: p,
  } : null;

  const stats = isTailor ? [
    { label: 'Jobs Done', value: String(s.completedJobs || 0), icon: Scissors },
    { label: 'Clients', value: String(s.customers || 0), icon: User },
    { label: 'Rating', value: String(p.tailor_profile?.rating_avg || '0'), icon: Star },
    { label: 'Active Jobs', value: String(s.activeJobs || 0), icon: Briefcase },
  ] : [
    { label: 'Orders', value: String(s.total_orders || 0), icon: Scissors },
    { label: 'Tailors', value: String(s.tailors_used || 0), icon: User },
    { label: 'Reviews', value: String(s.reviews_given || 0), icon: Star },
    { label: 'Since', value: p.created_at ? new Date(p.created_at).getFullYear().toString() : '', icon: Calendar },
  ];

  const openEdit = () => {
    setEditForm({
      name: profile.name,
      bio: profile.bio,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      specialties: [...(profile.specialties || [])],
    });
    setNewSpecialty('');
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile({
        business_name: isTailor ? editForm.name : undefined,
        name: !isTailor ? editForm.name : undefined,
        bio: editForm.bio,
        phone: editForm.phone,
        location: editForm.location,
        specialties: editForm.specialties,
      });
      invalidateCache('profile');
      refreshProfile();
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert('Image must be under 800KB. Please compress it before uploading.');
      e.target.value = '';
      return;
    }
    try {
      await usersApi.updateAvatar(file);
      invalidateCache('profile');
      refreshProfile();
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    }
  };

  const addSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !editForm.specialties.includes(trimmed)) {
      setEditForm(prev => ({ ...prev, specialties: [...prev.specialties, trimmed] }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (item) => {
    setEditForm(prev => ({ ...prev, specialties: prev.specialties.filter(s => s !== item) }));
  };

  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/;

  const handleUsernameChange = useCallback((val) => {
    setUsernameInput(val);
    setUsernameError(null);
    if (!val.trim()) { setUsernameStatus(null); return; }
    if (!usernameRegex.test(val)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const check = val;
    const timer = setTimeout(async () => {
      try {
        const res = await usersApi.checkUsername(check);
        if (check !== val) return; // stale
        setUsernameStatus(res?.data?.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleSetUsername = async () => {
    if (usernameStatus !== 'available') return;
    setSettingUsername(true);
    setUsernameError(null);
    try {
      await usersApi.setUsername(usernameInput.trim());
      invalidateCache('profile');
      refreshProfile();
      setShowUsernameForm(false);
      setUsernameInput('');
      setUsernameStatus(null);
    } catch (err) {
      setUsernameError(err.message || 'Failed to set username');
    } finally {
      setSettingUsername(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-400">Could not load profile.</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:p-4 md:p-8 max-w-4xl mx-auto space-y-5 md:space-y-6">
      {/* Cover + Avatar */}
      <div className="relative bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 rounded-2xl sm:rounded-3xl h-32 sm:h-40 md:h-48">
        <div className="absolute inset-0 opacity-20 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="absolute top-4 right-8 w-32 h-32 bg-white/20 rounded-full" />
          <div className="absolute bottom-0 left-12 w-20 h-20 bg-white/15 rounded-full" />
          <div className="absolute top-8 left-1/3 w-16 h-16 bg-white/10 rounded-full" />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-6 md:left-8">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-[3px] sm:ring-4 ring-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-xl sm:text-2xl md:text-3xl ring-[3px] sm:ring-4 ring-white shadow-lg" style={{ backgroundColor: profile.avatar_color || '#D4A574' }}>
                {profile.initials}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
              <Camera size={13} className="text-gray-500" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={openEdit}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-medium hover:bg-white/30 transition-colors"
        >
          <Edit3 size={13} />
          <span className="hidden sm:inline">Edit Profile</span>
          <span className="sm:hidden">Edit</span>
        </button>
      </div>

      {/* Name + Username + Role Badge */}
      <div className="pt-12 sm:pt-14 md:pt-16 px-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900">{profile.name}</h1>
          {p.username && (
            <span className="text-sm text-gray-400 font-medium">@{p.username}</span>
          )}
        </div>
        <div className="mt-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isTailor
              ? 'bg-gold-50 text-gold-700 border border-gold-200'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          }`}>
            {isTailor ? <Scissors size={12} /> : <User size={12} />}
            {profile.role}
          </span>
        </div>
        {profile.bio && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-lg">{profile.bio}</p>
        )}
      </div>

      {/* Username prompt */}
      {!p.username && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          {showUsernameForm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <AtSign size={16} className="text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Choose your username</p>
              </div>
              <p className="text-xs text-amber-600">This can only be set once. Letters, numbers, dots, underscores. Starts with a letter.</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => handleUsernameChange(e.target.value.toLowerCase())}
                  placeholder="yourname"
                  maxLength={30}
                  className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-gray-400" />}
                  {usernameStatus === 'available' && <Check size={16} className="text-emerald-500" />}
                  {usernameStatus === 'taken' && <X size={16} className="text-red-500" />}
                  {usernameStatus === 'invalid' && <AlertCircle size={16} className="text-amber-500" />}
                </span>
              </div>
              {usernameStatus === 'taken' && <p className="text-xs text-red-500">Username is already taken</p>}
              {usernameStatus === 'invalid' && <p className="text-xs text-amber-600">3-30 chars, starts with a letter, only letters/numbers/dots/underscores</p>}
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowUsernameForm(false); setUsernameInput(''); setUsernameStatus(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSetUsername}
                  disabled={usernameStatus !== 'available' || settingUsername}
                  className="flex-1 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {settingUsername ? <Loader2 size={14} className="animate-spin" /> : 'Set Username'}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AtSign size={16} className="text-amber-600" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Set your username</span> — you can only do this once.
                </p>
              </div>
              <button
                onClick={() => setShowUsernameForm(true)}
                className="px-4 py-2 rounded-xl bg-gold-500 text-white text-xs font-semibold hover:bg-gold-600 transition-colors"
              >
                Choose
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileTap={{ scale: 0.97 }}
            className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-2.5 sm:p-4 text-center shadow-sm"
          >
            <stat.icon size={16} className="text-gold-500 mx-auto mb-1 sm:mb-1.5" />
            <p className="text-base sm:text-lg md:text-xl font-heading font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <h3 className="px-5 pt-5 pb-3 font-heading font-semibold text-gray-800">Contact Information</h3>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Mail size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm text-gray-700 truncate">{profile.email}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Phone size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-sm text-gray-700">{profile.phone}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <MapPin size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Location</p>
            <p className="text-sm text-gray-700">{profile.location}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Calendar size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Member Since</p>
            <p className="text-sm text-gray-700">{profile.joined}</p>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-heading font-semibold text-gray-800 mb-3">
          {isTailor ? 'Specialties' : 'Style Preferences'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {(profile.specialties || []).map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-xl bg-gold-50 text-gold-700 text-xs font-medium border border-gold-100"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditing(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-heading font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition"
                  />
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {isTailor ? 'Specialties' : 'Style Preferences'}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.specialties?.map((item) => (
                      <span
                        key={item}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50 text-gold-700 text-xs font-medium border border-gold-100"
                      >
                        {item}
                        <button onClick={() => removeSpecialty(item)} className="hover:text-red-500 transition">
                          <Trash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="Add new..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition"
                    />
                    <button
                      onClick={addSpecialty}
                      className="px-3 py-2 bg-gold-50 text-gold-600 rounded-xl hover:bg-gold-100 transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 pb-safe">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 transition shadow-sm shadow-gold-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
