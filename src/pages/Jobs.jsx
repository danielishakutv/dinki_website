import React, { useState } from 'react';
import { Scissors } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import AddJobModal from '../components/jobs/AddJobModal';
import { jobs as jobsApi, customers as customersApi } from '../lib/api';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

export default function Jobs({ showAddJob, setShowAddJob }) {
  const { data: jobsRes, loading: jobsLoading, refresh: refreshJobs } = useApi(
    'jobs-list', () => jobsApi.list({ limit: 100 }), { ttl: TTL.medium }
  );
  const { data: custRes, loading: custLoading } = useApi(
    'customers-list', () => customersApi.list({ limit: 100 }), { ttl: TTL.medium }
  );

  const jobs = jobsRes?.data && Array.isArray(jobsRes.data) ? jobsRes.data : [];
  const customers = custRes?.data && Array.isArray(custRes.data) ? custRes.data : [];
  const loading = jobsLoading || custLoading;

  const handleSaveJob = async (formData) => {
    await jobsApi.create(formData);
    invalidateCache('jobs');
    refreshJobs();
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
