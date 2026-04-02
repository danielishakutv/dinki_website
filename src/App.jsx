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

// Placeholder pages for settings & help
function PlaceholderPage({ title, emoji }) {
  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-5xl mb-4">{emoji}</p>
      <h1 className="text-xl font-heading font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-sm text-gray-400">This section is under development.</p>
    </div>
  );
}

export default function App() {
  const [customers, setCustomers] = useLocalStorage('dinki-customers', initialCustomers);
  const [jobs, setJobs] = useLocalStorage('dinki-jobs', initialJobs);
  const [showAddJob, setShowAddJob] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/*"
        element={
          <Layout>
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
              <Route
                path="customer-dashboard"
                element={<CustomerDashboard />}
              />
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
              <Route
                path="/settings"
                element={<PlaceholderPage title="Settings" emoji="⚙️" />}
              />
              <Route
                path="/help"
                element={<PlaceholderPage title="Help & Support" emoji="💬" />}
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
