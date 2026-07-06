import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Star, Heart, MessageCircle, Clock, ChevronRight, Search, Shirt, Gift, Loader2, RefreshCw, Compass, Users } from 'lucide-react';
import { VerifiedBadge, LevelBadge } from '../components/TailorBadges';
import ExploreBanner from '../components/styles/ExploreBanner';
import PendingTasksBanner from '../components/PendingTasksBanner';
import OnboardingTour from '../components/OnboardingTour';
import { useAuth } from '../contexts/AuthContext';
import { useApi, TTL, invalidateCache } from '../hooks/useApi';
import {
  orders as ordersApi,
  storefronts as storefrontsApi,
  favourites as favouritesApi,
  referrals as referralsApi,
  conversations as convoApi,
} from '../lib/api';

const ORDER_STATUS = {
  pending:     { label: 'Pending',     chip: 'bg-gray-100 text-gray-700',    progress: 10 },
  accepted:    { label: 'Accepted',    chip: 'bg-indigo-100 text-indigo-700', progress: 35 },
  in_progress: { label: 'In Progress', chip: 'bg-blue-100 text-blue-700',    progress: 65 },
  completed:   { label: 'Completed',   chip: 'bg-green-100 text-green-700',  progress: 100 },
  cancelled:   { label: 'Cancelled',   chip: 'bg-red-100 text-red-600',      progress: 0 },
};

const formatNaira = (n) => (n || n === 0 ? `₦${Number(n).toLocaleString('en-NG')}` : null);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

function ErrorCard({ message, onRetry }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      <button onClick={onRetry} className="inline-flex items-center gap-1.5 text-sm text-gold-600 font-medium hover:underline">
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

function OrderCard({ order, onCancel, cancelling }) {
  const meta = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base">{order.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600">by {order.tailor_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap ${meta.chip}`}>
          {meta.label}
        </span>
      </div>
      {order.status !== 'cancelled' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm text-gray-600">Progress</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900">{meta.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${meta.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-xs sm:text-sm text-gray-600">
          {order.due_date ? <>Due: <span className="font-medium text-gray-900">{formatDate(order.due_date)}</span></> : <>Placed {formatDate(order.created_at)}</>}
        </div>
        <div className="flex items-center gap-3">
          {order.status === 'pending' && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={cancelling === order.id}
              className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
            >
              {cancelling === order.id ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
          {formatNaira(order.budget) && <p className="text-lg font-bold text-gray-900">{formatNaira(order.budget)}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerDashboard({ tab = 'home' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cancelling, setCancelling] = useState(null);
  const [chatStarting, setChatStarting] = useState(null);
  const [savedTailors, setSavedTailors] = useState(null); // Set once favourites load

  const ordersQ = useApi('orders-mine', () => ordersApi.listMine({}), { ttl: TTL.medium });
  const tailorsQ = useApi('storefronts-list', () => storefrontsApi.search({ limit: 10 }), { ttl: TTL.medium });
  // Key includes the limit — this cache is shared by key string, and the
  // /referral page fetches limit=20 under its own key.
  const referralsQ = useApi('referrals-me-1', () => referralsApi.getMine({ limit: 1 }), { ttl: TTL.long });
  const favouritesQ = useApi('favourites-tailor', () => favouritesApi.list('tailor'), { ttl: TTL.medium });

  const orders = ordersQ.data?.data?.orders || [];
  const tailors = tailorsQ.data?.data?.tailors || [];
  const referralStats = referralsQ.data?.data?.stats;

  // Hydrate the optimistic saved-set ONCE from the server list. Toggles are
  // blocked until then — toggling against an unhydrated empty set would both
  // mask real saves and desync UI from the server's toggle semantics.
  React.useEffect(() => {
    const favs = favouritesQ.data?.data?.favourites;
    if (favs && savedTailors === null) {
      setSavedTailors(new Set(favs.map((f) => f.item_id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favouritesQ.data]);

  const favTailorIds = savedTailors
    ?? new Set((favouritesQ.data?.data?.favourites || []).map((f) => f.item_id));

  const activeOrders = orders.filter((o) => ['pending', 'accepted', 'in_progress'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const [cancelError, setCancelError] = useState('');
  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    setCancelError('');
    try {
      await ordersApi.cancel(orderId);
      invalidateCache('orders');
      ordersQ.refresh();
    } catch (err) {
      setCancelError(err.message || 'Could not cancel this order — it may have just been accepted.');
      invalidateCache('orders');
      ordersQ.refresh(); // show the true state either way
    }
    setCancelling(null);
  };

  const handleChat = async (tailorId) => {
    if (chatStarting) return;
    setChatStarting(tailorId);
    try {
      const res = await convoApi.start({ participant_id: tailorId });
      const conversationId = res.data?.conversation?.id || res.data?.id;
      invalidateCache('conversations');
      navigate(conversationId ? `/messages/${conversationId}` : '/messages');
    } catch {
      navigate('/messages');
    } finally {
      setChatStarting(null);
    }
  };

  const flipSaved = (tailorId) => {
    setSavedTailors((prev) => {
      const next = new Set(prev);
      if (next.has(tailorId)) next.delete(tailorId);
      else next.add(tailorId);
      return next;
    });
  };

  const toggleSaveTailor = (tailorId) => {
    if (savedTailors === null) return; // favourites not loaded yet — see hydration above
    flipSaved(tailorId);
    favouritesApi.toggle('tailor', tailorId)
      .then(() => invalidateCache('favourites'))
      .catch(() => flipSaved(tailorId)); // revert only this item
  };

  const TailorRow = ({ tailor, compact = false }) => (
    <div className={compact ? 'flex items-center gap-3 cursor-pointer' : undefined} onClick={compact ? () => navigate(`/${tailor.storefront_slug}`) : undefined}>
      {tailor.avatar_url ? (
        <img src={tailor.avatar_url} alt={tailor.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: tailor.avatar_color || '#6366f1' }}>
          {tailor.initials || tailor.name?.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-gray-900 text-sm truncate">{tailor.name}</p>
          {tailor.verified && <VerifiedBadge size={13} />}
        </div>
        <p className="text-xs text-gray-500 truncate">{(tailor.specialties || []).slice(0, 2).join(' · ') || [tailor.location_city, tailor.location_state].filter(Boolean).join(', ')}</p>
      </div>
      {tailor.rating_avg > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-500">
          <Star size={11} className="text-yellow-400" fill="currentColor" />
          {parseFloat(tailor.rating_avg).toFixed(1)}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <OnboardingTour role="customer" />
      <div className="mb-4"><PendingTasksBanner /></div>

      {/* HOME TAB */}
      {tab === 'home' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

          {/* Greeting */}
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
              Hello, {(user?.name || 'there').split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-400 mt-1">Find tailors, track orders, and explore styles.</p>
          </div>

          <ExploreBanner />

          {/* Quick Actions */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate('/near-me')}
              className="hidden md:flex bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:border-gold-200 hover:shadow-md transition-all flex-col items-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center group-hover:bg-gold-100 transition">
                <Search size={19} className="text-gold-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-700 leading-tight text-center">Find Tailor</span>
            </button>
            <button
              onClick={() => navigate('/order/new')}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
                <Shirt size={19} className="text-teal-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-700 leading-tight text-center">New Order</span>
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition">
                <MessageCircle size={19} className="text-indigo-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-700 leading-tight text-center">Messages</span>
            </button>
            <button
              onClick={() => navigate('/referral')}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition">
                <Gift size={19} className="text-rose-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-700 leading-tight text-center">Refer & Earn</span>
            </button>
          </div>

          {/* Stats Grid — real counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag size={18} className="text-gold-500" />
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Active</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{ordersQ.loading ? '—' : activeOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Shirt size={18} className="text-teal-500" />
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Done</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{ordersQ.loading ? '—' : completedOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Heart size={18} className="text-red-500" fill="currentColor" />
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-medium">Saved</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Saved Tailors</p>
              <p className="text-2xl font-bold text-gray-900">{favouritesQ.loading ? '—' : favTailorIds.size}</p>
            </div>
            <button
              onClick={() => navigate('/referral')}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm text-left hover:border-rose-200 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <Users size={18} className="text-purple-500" />
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Invites</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Friends Joined</p>
              <p className="text-2xl font-bold text-gray-900">{referralsQ.loading ? '—' : (referralStats?.joined ?? 0)}</p>
            </button>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-gray-900">Recent Orders</h3>
              <button onClick={() => navigate('/orders')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight size={13} />
              </button>
            </div>
            {ordersQ.loading ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
            ) : ordersQ.error ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Couldn't load your orders.</p>
                <button onClick={ordersQ.refresh} className="text-xs text-gold-600 font-medium hover:underline">Try again</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">No orders yet — find a tailor and place your first one.</p>
                <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-1.5 text-sm text-gold-600 font-medium hover:underline">
                  <Compass size={14} /> Explore styles
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => {
                  const meta = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                  return (
                    <div key={order.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{order.title}</p>
                        <p className="text-xs text-gray-500">by {order.tailor_name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${meta.chip}`}>{meta.label}</span>
                        {formatNaira(order.budget) && <span className="text-sm font-bold text-gray-900">{formatNaira(order.budget)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nearby Tailors Preview */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-gray-900">Tailors on Dinki</h3>
              <button onClick={() => navigate('/near-me')} className="text-xs text-gold-600 font-medium flex items-center gap-1 hover:underline">
                See all <ChevronRight size={13} />
              </button>
            </div>
            {tailorsQ.loading ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
            ) : tailorsQ.error ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Couldn't load tailors.</p>
                <button onClick={tailorsQ.refresh} className="text-xs text-gold-600 font-medium hover:underline">Try again</button>
              </div>
            ) : tailors.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Tailors are joining soon — check back shortly.</p>
            ) : (
              <div className="space-y-3">
                {tailors.slice(0, 3).map((tailor) => (
                  <TailorRow key={tailor.tailor_id} tailor={tailor} compact />
                ))}
              </div>
            )}
          </div>

        </motion.div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900 mb-4">Your Orders</h2>
          {cancelError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{cancelError}</div>
          )}
          {ordersQ.loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gold-500" /></div>
          ) : ordersQ.error ? (
            <ErrorCard message="We couldn't load your orders. Please check your connection." onRetry={ordersQ.refresh} />
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={24} className="text-gold-500" />
              </div>
              <h3 className="font-heading font-bold text-gray-900 mb-1.5">No orders yet</h3>
              <p className="text-sm text-gray-500 mb-5">Discover talented tailors and place your first order.</p>
              <button
                onClick={() => navigate('/explore')}
                className="px-5 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition inline-flex items-center gap-2"
              >
                <Compass size={15} /> Explore Styles
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} onCancel={handleCancel} cancelling={cancelling} />
            ))
          )}
        </motion.div>
      )}

      {/* NEAR ME TAB — live tailor directory */}
      {tab === 'near-me' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-teal-500" />
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Find a Tailor</h2>
          </div>
          {tailorsQ.loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gold-500" /></div>
          ) : tailorsQ.error ? (
            <ErrorCard message="We couldn't load tailors. Please check your connection." onRetry={tailorsQ.refresh} />
          ) : tailors.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <p className="text-sm text-gray-500">No tailors have set up their storefronts yet — check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tailors.map((tailor) => (
                <motion.div key={tailor.tailor_id} whileHover={{ y: -2 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                  {/* Top row: avatar + name + location */}
                  <div className="flex items-center gap-3 mb-3">
                    {tailor.avatar_url ? (
                      <img src={tailor.avatar_url} alt={tailor.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: tailor.avatar_color || '#6366f1' }}>
                        {tailor.initials || tailor.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-heading font-bold text-gray-900 text-sm truncate">{tailor.name}</h3>
                        {tailor.verified && <VerifiedBadge size={14} />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-gray-500 truncate">{(tailor.specialties || []).slice(0, 2).join(' · ') || 'Tailor'}</p>
                        <LevelBadge completedOrders={tailor.completed_jobs} compact />
                      </div>
                    </div>
                    {(tailor.location_city || tailor.location_state) && (
                      <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1 flex-shrink-0 border border-teal-100">
                        <MapPin size={11} /> {tailor.location_city || tailor.location_state}
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 pl-0.5">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" fill="currentColor" />
                      <span className="text-gray-700 font-medium">{tailor.rating_avg > 0 ? parseFloat(tailor.rating_avg).toFixed(1) : 'New'}</span>
                      {tailor.rating_count > 0 && <>({tailor.rating_count})</>}
                    </span>
                    {tailor.start_price > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium text-gray-700">₦{new Intl.NumberFormat('en-NG').format(tailor.start_price / 100)}+</span>
                      </>
                    )}
                    {tailor.response_time && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {tailor.response_time}</span>
                      </>
                    )}
                  </div>

                  {/* Buttons row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/${tailor.storefront_slug}`)}
                      className="flex-1 py-2.5 bg-gold-500 text-white rounded-xl text-xs font-semibold hover:bg-gold-600 transition flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm shadow-gold-500/15"
                    >
                      View Storefront
                    </button>
                    <button
                      onClick={() => handleChat(tailor.tailor_id)}
                      disabled={chatStarting === tailor.tailor_id}
                      className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1.5 min-h-[44px] text-gray-700"
                    >
                      {chatStarting === tailor.tailor_id ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />} Chat
                    </button>
                    <button
                      onClick={() => toggleSaveTailor(tailor.tailor_id)}
                      disabled={savedTailors === null}
                      className={`w-11 rounded-xl text-xs font-medium transition border flex-shrink-0 min-h-[44px] flex items-center justify-center disabled:opacity-50 ${
                        favTailorIds.has(tailor.tailor_id)
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
                      }`}
                    >
                      <Heart size={16} fill={favTailorIds.has(tailor.tailor_id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
