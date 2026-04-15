import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';

// Critical route — loaded eagerly
import Landing from './pages/Landing';

// Lazy-loaded routes — each becomes its own chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const Customers = lazy(() => import('./pages/Customers'));
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
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'));
const NewJobPage = lazy(() => import('./pages/NewJobPage'));
const Referral = lazy(() => import('./pages/Referral'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const News = lazy(() => import('./pages/News'));

function PageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const userRole = user?.role || null;

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-cloud"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/onboarding" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Onboarding /></Suspense></ProtectedRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout userRole={userRole}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route
                  path="dashboard"
                  element={
                    userRole === 'customer' ? (
                      <CustomerDashboard tab="home" />
                    ) : (
                      <Dashboard />
                    )
                  }
                />
                {/* Customer routes */}
                <Route path="home" element={<CustomerDashboard tab="home" />} />
                <Route path="orders" element={<CustomerDashboard tab="orders" />} />
                <Route path="near-me" element={<CustomerDashboard tab="near-me" />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/new" element={<NewJobPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/profile" element={<Profile userRole={userRole} />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:id" element={<ChatDetail />} />
                <Route path="/favourites" element={<Favourites />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/notifications/:id" element={<NotificationDetail />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="/tailor/:id" element={<TailorStorefront userRole={userRole} />} />
                <Route path="/marketplace/style/:id" element={<StyleDetail />} />
                <Route path="/order/new" element={<PlaceOrder />} />
                <Route path="/referral" element={<Referral />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/news" element={<News />} />
              </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
