import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Jobs from './pages/Jobs';
import JobDetailPage from './pages/JobDetailPage';
import Marketplace from './pages/Marketplace';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ChatDetail from './pages/ChatDetail';
import Favourites from './pages/Favourites';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import SettingsPage from './pages/SettingsPage';
import HelpSupport from './pages/HelpSupport';
import TailorStorefront from './pages/TailorStorefront';
import StyleDetail from './pages/StyleDetail';
import PlaceOrder from './pages/PlaceOrder';
import Referral from './pages/Referral';
import Onboarding from './pages/Onboarding';
import Leaderboard from './pages/Leaderboard';
import News from './pages/News';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const userRole = user?.role || null;
  const [showAddJob, setShowAddJob] = useState(false);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-cloud"><div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout userRole={userRole} onAddJob={() => setShowAddJob(true)}>
              <Routes>
              <Route
                path="dashboard"
                element={
                  userRole === 'customer' ? (
                    <CustomerDashboard tab="home" />
                  ) : (
                    <Dashboard setShowAddJob={setShowAddJob} />
                  )
                }
              />
              {/* Customer routes */}
              <Route path="home" element={<CustomerDashboard tab="home" />} />
              <Route path="orders" element={<CustomerDashboard tab="orders" />} />
              <Route path="near-me" element={<CustomerDashboard tab="near-me" />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route
                path="/jobs"
                element={
                  <Jobs
                    showAddJob={showAddJob}
                    setShowAddJob={setShowAddJob}
                  />
                }
              />
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
          </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
