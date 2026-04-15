import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Scissors } from 'lucide-react';
import AddJobForm from '../components/jobs/AddJobForm';
import { jobs as jobsApi, customers as customersApi } from '../lib/api';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

export default function NewJobPage() {
  const navigate = useNavigate();

  const { data: custRes, loading } = useApi(
    'customers-list', () => customersApi.list({ limit: 100 }), { ttl: TTL.medium }
  );

  const customers = custRes?.data && Array.isArray(custRes.data) ? custRes.data : [];

  const handleSaveJob = async (formData) => {
    await jobsApi.create(formData);
    invalidateCache('jobs', 'jobs-list');
    navigate('/jobs');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="btn-touch flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-gold-400 to-amber-500" />
        <div className="p-5 md:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Scissors size={20} className="text-gold-500" />
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-gray-900">New Job</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new job without leaving the main workflow.</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gold-500" />
            </div>
          ) : (
            <AddJobForm
              onSave={handleSaveJob}
              customers={customers}
              onCancel={() => navigate('/jobs')}
            />
          )}
        </div>
      </div>
    </div>
  );
}