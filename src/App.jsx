import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import MatomoRouteTracker from './components/MatomoRouteTracker';
import VerifyGate, { mustVerify } from './components/VerifyGate';

// Critical route — loaded eagerly
import Landing from './pages/Landing';

// Lazy-loaded routes — each becomes its own chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const NewCustomerPage = lazy(() => import('./pages/NewCustomerPage'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
const ChatDetail = lazy(() => import('./pages/ChatDetail'));
const Favourites = lazy(() => import('./pages/Favourites'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotificationDetail = lazy(() => import('./pages/NotificationDetail'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const TailorStorefront = lazy(() => import('./pages/TailorStorefront'));
const StyleDetail = lazy(() => import('./pages/StyleDetail'));
const Explore = lazy(() => import('./pages/Explore'));
const AddStyle = lazy(() => import('./pages/AddStyle'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const MyMeasurements = lazy(() => import('./pages/MyMeasurements'));
const PublicMeasurement = lazy(() => import('./pages/PublicMeasurement'));
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'));
const NewJobPage = lazy(() => import('./pages/NewJobPage'));
const Referral = lazy(() => import('./pages/Referral'));
const TailorAnalytics = lazy(() => import('./pages/TailorAnalytics'));
const ClaimAccount = lazy(() => import('./pages/ClaimAccount'));
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));
const AgentRegister = lazy(() => import('./pages/agent/AgentRegister'));
const AgentRecruits = lazy(() => import('./pages/agent/AgentRecruits'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const News = lazy(() => import('./pages/News'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Invite = lazy(() => import('./pages/Invite'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

function PageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const isAdminRole = (user) => user?.role === 'admin' || user?.role === 'superadmin';

// Customers and admins get sent to their own home rather than a tailor workspace
// they have no data for.
function TailorOnly({ userRole, children }) {
  if (userRole && userRole !== 'tailor') return <Navigate to="/dashboard" replace />;
  return children;
}

// The agent console is role-gated client-side too. Every /agents endpoint is
// enforced server-side; this only stops a non-agent seeing UI that would fail.
function AgentOnly({ userRole, children }) {
  if (userRole && userRole !== 'agent') return <Navigate to="/dashboard" replace />;
  return children;
}

// Where a logged-in user belongs by default. Admins are NOT tailors/customers —
// they go straight to the admin dashboard and never see the onboarding wizard.
const homePath = (user) => {
  if (isAdminRole(user)) return '/admin';
  if (user?.role === 'agent') return '/agent';
  return user?.onboarding_completed === false ? '/onboarding' : '/dashboard';
};

function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  // Admins and agents skip onboarding entirely — it asks for a shop location and
  // tailoring specialities, which mean nothing for either role and would trap
  // them in a form they can't meaningfully complete.
  const skipsOnboarding = isAdminRole(user) || user?.role === 'agent';
  if (user && !skipsOnboarding && !user.onboarding_completed && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function ProtectedAppLayout({ userRole }) {
  const { user } = useAuth();
  // 7-day grace expired and still unverified → hard gate the whole app shell.
  if (mustVerify(user)) return <VerifyGate />;
  return (
    <ProtectedRoute>
      <Layout userRole={userRole}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

// Only admin/superadmin accounts may render anything below /admin.
// Anyone else lands back on their own dashboard — no leaking route
// structure via error screens, no flashes of admin UI.
function AdminOnlyRoute({ children }) {
  const { user } = useAuth();
  const role = user?.role;
  if (role !== 'admin' && role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const userRole = user?.role || null;

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-cloud"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <>
      <MatomoRouteTracker />
      <Routes>
      <Route path="/" element={user ? <Navigate to={homePath(user)} replace /> : <Landing />} />
      <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
      <Route path="/invite/:code" element={<Suspense fallback={<PageLoader />}><Invite /></Suspense>} />
      {/* Public: an agent-registered person claiming their account. They have no
          session yet, so this cannot sit behind ProtectedRoute. */}
      <Route path="/claim/:token" element={<Suspense fallback={<PageLoader />}><ClaimAccount /></Suspense>} />
      <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Onboarding /></Suspense></ProtectedRoute>} />

      {/* Public discovery — browsable by guests and members alike. FeedShell inside
          each renders the right chrome (app nav when logged in, public header when not). */}
      <Route path="/explore" element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>} />
      <Route path="/style/:id" element={<Suspense fallback={<PageLoader />}><StyleDetail /></Suspense>} />
      {/* Public, no-auth measurement share page */}
      <Route path="/m/:token" element={<Suspense fallback={<PageLoader />}><PublicMeasurement /></Suspense>} />
      {/* Email verification link target (works logged-in or out) */}
      <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />

      {/* Protected app shell. Static paths here out-rank /:handle below in React Router's ranking,
          so e.g. /dashboard matches Dashboard, not the public storefront. */}
      <Route element={<ProtectedAppLayout userRole={userRole} />}>
        <Route path="/dashboard" element={isAdminRole(user) ? <Navigate to="/admin" replace /> : userRole === 'agent' ? <Navigate to="/agent" replace /> : userRole === 'customer' ? <CustomerDashboard tab="home" /> : <Dashboard />} />
        <Route path="/home" element={<CustomerDashboard tab="home" />} />
        <Route path="/orders" element={<CustomerDashboard tab="orders" />} />
        <Route path="/near-me" element={<CustomerDashboard tab="near-me" />} />
        <Route path="/measurements" element={<MyMeasurements />} />
        <Route path="/styles/new" element={<AddStyle />} />
        {/* Tailor-only. These pages read from the on-device database, which is
            only opened for tailors — the sync endpoints behind it are
            tailor-scoped server-side. Without this gate a customer landing on
            /customers would wait on a database that is never going to open. */}
        <Route path="/customers" element={<TailorOnly userRole={userRole}><Customers /></TailorOnly>} />
        <Route path="/customers/new" element={<TailorOnly userRole={userRole}><NewCustomerPage /></TailorOnly>} />
        <Route path="/customers/:id" element={<TailorOnly userRole={userRole}><CustomerDetail /></TailorOnly>} />
        <Route path="/analytics" element={<TailorOnly userRole={userRole}><TailorAnalytics /></TailorOnly>} />
        <Route path="/agent" element={<AgentOnly userRole={userRole}><AgentDashboard /></AgentOnly>} />
        <Route path="/agent/register" element={<AgentOnly userRole={userRole}><AgentRegister /></AgentOnly>} />
        <Route path="/agent/recruits" element={<AgentOnly userRole={userRole}><AgentRecruits /></AgentOnly>} />
        <Route path="/jobs" element={<TailorOnly userRole={userRole}><Jobs /></TailorOnly>} />
        <Route path="/jobs/new" element={<TailorOnly userRole={userRole}><NewJobPage /></TailorOnly>} />
        <Route path="/jobs/:id" element={<TailorOnly userRole={userRole}><JobDetailPage /></TailorOnly>} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/style/:id" element={<StyleDetail />} />
        <Route path="/profile" element={<Profile userRole={userRole} />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<ChatDetail />} />
        <Route path="/favourites" element={<Favourites />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/notifications/:id" element={<NotificationDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/news" element={<News />} />
        <Route path="/order/new" element={<PlaceOrder />} />
        <Route path="/referral" element={<Referral />} />
        {/* Owner dashboard/editor view — /t/:handle is reachable only when authenticated.
            /my-storefront is the slug-less alias: it resolves the owner's storefront by
            account (GET /storefronts/me), so a broken or missing slug can't dead-end it. */}
        <Route path="/t/:handle" element={<TailorStorefront userRole={userRole} editable />} />
        <Route path="/my-storefront" element={<TailorStorefront userRole={userRole} editable />} />

        {/* Admin module — gated by role. Nested <Outlet /> so each admin
            sub-page is lazy-loaded and isolated from siblings. */}
        <Route path="/admin" element={<AdminOnlyRoute><AdminLayout /></AdminOnlyRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Route>

      {/* Public storefront — guest-viewable. Ranks below the static routes above. */}
      <Route path="/:handle" element={<Suspense fallback={<PageLoader />}><TailorStorefront userRole={null} /></Suspense>} />

      {/* Catch-all — multi-segment unknown URLs previously rendered a BLANK page. */}
      <Route path="*" element={<NotFoundPage user={user} />} />
      </Routes>
    </>
  );
}

function NotFoundPage({ user }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cloud">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-heading font-bold text-gold-500 mb-3">404</p>
        <h1 className="text-lg font-heading font-bold text-gray-900 mb-1.5">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <a
          href={user ? '/dashboard' : '/'}
          className="inline-block px-5 py-3 bg-gold-500 text-white rounded-xl text-sm font-semibold hover:bg-gold-600 transition"
        >
          {user ? 'Go to Dashboard' : 'Go Home'}
        </a>
      </div>
    </div>
  );
}
