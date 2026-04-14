import React, { useState, useEffect, useCallback } from 'react';
import { Scissors } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import AddJobModal from '../components/jobs/AddJobModal';
import { jobs as jobsApi, customers as customersApi } from '../lib/api';

export default function Jobs({ showAddJob, setShowAddJob }) {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [jobsRes, custRes] = await Promise.all([
        jobsApi.list({ limit: 100 }),
        customersApi.list({ limit: 100 }),
      ]);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveJob = async (formData) => {
    await jobsApi.create(formData);
    await loadData();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Scissors size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Jobs & Orders</h1>
      </div>

      <JobList
        jobs={jobs}
        onAddJob={() => setShowAddJob(true)}
        loading={loading}
      />

      <AddJobModal
        isOpen={showAddJob}
        onClose={() => setShowAddJob(false)}
        onSave={handleSaveJob}
        customers={customers}
      />
    </div>
  );
}
