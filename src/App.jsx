import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialCustomers, initialJobs } from './data/mockData';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TailorDashboard from './pages/TailorDashboard';
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

export default function App() {
  const [customers, setCustomers] = useLocalStorage('dinki-customers', initialCustomers);
  const [jobs, setJobs] = useLocalStorage('dinki-jobs', initialJobs);
  const [userRole, setUserRole] = useLocalStorage('dinki-user-role', null);
  const [showAddJob, setShowAddJob] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<Landing setUserRole={setUserRole} />} />
      <Route
        path="/*"
        element={
          <Layout userRole={userRole} onAddJob={() => setShowAddJob(true)}>
            <Routes>
              <Route
                path="dashboard"
                element={
                  <Dashboard
                    jobs={jobs}
                    customers={customers}
                    setShowAddJob={setShowAddJob}
                  />
                }
              />
              <Route
                path="tailor-dashboard"
                element={<TailorDashboard />}
              />
              {/* Customer routes */}
              <Route path="home" element={<CustomerDashboard tab="home" />} />
              <Route path="orders" element={<CustomerDashboard tab="orders" />} />
              <Route path="near-me" element={<CustomerDashboard tab="near-me" />} />
              <Route path="customer-dashboard" element={<CustomerDashboard tab="home" />} />
              <Route
                path="/customers"
                element={<Customers customers={customers} setCustomers={setCustomers} />}
              />
              <Route
                path="/customers/:id"
                element={
                  <CustomerDetail
                    customers={customers}
                    setCustomers={setCustomers}
                    jobs={jobs}
                  />
                }
              />
              <Route
                path="/jobs"
                element={
                  <Jobs
                    jobs={jobs}
                    setJobs={setJobs}
                    customers={customers}
                    showAddJob={showAddJob}
                    setShowAddJob={setShowAddJob}
                  />
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <JobDetailPage
                    jobs={jobs}
                    setJobs={setJobs}
                    customers={customers}
                  />
                }
              />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/profile" element={<Profile userRole={userRole} />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<ChatDetail />} />
              <Route path="/favourites" element={<Favourites />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/notifications/:id" element={<NotificationDetail />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpSupport />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
