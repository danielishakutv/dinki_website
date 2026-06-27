import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import MatomoRouteTracker from './components/MatomoRouteTracker';

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
const MyMeasurements = lazy(() => import('./pages/MyMeasurements'));
const PublicMeasurement = lazy(() => import('./pages/PublicMeasurement'));
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'));
const NewJobPage = lazy(() => import('./pages/NewJobPage'));
const Referral = lazy(() => import('./pages/Referral'));
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

function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user && !user.onboarding_completed && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function ProtectedAppLayout({ userRole }) {
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
      <Route path="/" element={user ? <Navigate to={user.onboarding_completed === false ? '/onboarding' : '/dashboard'} replace /> : <Landing />} />
      <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
      <Route path="/invite/:code" element={<Suspense fallback={<PageLoader />}><Invite /></Suspense>} />
      <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Onboarding /></Suspense></ProtectedRoute>} />

      {/* Public discovery — browsable by guests and members alike. FeedShell inside
          each renders the right chrome (app nav when logged in, public header when not). */}
      <Route path="/explore" element={<Suspense fallback={<PageLoader />}><Explore /></Suspense>} />
      <Route path="/style/:id" element={<Suspense fallback={<PageLoader />}><StyleDetail /></Suspense>} />
      {/* Public, no-auth measurement share page */}
      <Route path="/m/:token" element={<Suspense fallback={<PageLoader />}><PublicMeasurement /></Suspense>} />

      {/* Protected app shell. Static paths here out-rank /:handle below in React Router's ranking,
          so e.g. /dashboard matches Dashboard, not the public storefront. */}
      <Route element={<ProtectedAppLayout userRole={userRole} />}>
        <Route path="/dashboard" element={userRole === 'customer' ? <CustomerDashboard tab="home" /> : <Dashboard />} />
        <Route path="/home" element={<CustomerDashboard tab="home" />} />
        <Route path="/orders" element={<CustomerDashboard tab="orders" />} />
        <Route path="/near-me" element={<CustomerDashboard tab="near-me" />} />
        <Route path="/measurements" element={<MyMeasurements />} />
        <Route path="/styles/new" element={<AddStyle />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/new" element={<NewCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/new" element={<NewJobPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
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
        {/* Owner dashboard/editor view — /t/:handle is reachable only when authenticated */}
        <Route path="/t/:handle" element={<TailorStorefront userRole={userRole} editable />} />

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
      </Routes>
    </>
  );
}
