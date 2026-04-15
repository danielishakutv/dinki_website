import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import { jobs as jobsApi } from '../lib/api';
import { useApi, TTL } from '../hooks/useApi';

export default function Jobs() {
  const navigate = useNavigate();
  const { data: jobsRes, loading } = useApi(
    'jobs-list', () => jobsApi.list({ limit: 100 }), { ttl: TTL.medium }
  );

  const jobs = jobsRes?.data && Array.isArray(jobsRes.data) ? jobsRes.data : [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Scissors size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Jobs & Orders</h1>
      </div>

      <JobList
        jobs={jobs}
        onAddJob={() => navigate('/jobs/new')}
        loading={loading}
      />
    </div>
  );
}
