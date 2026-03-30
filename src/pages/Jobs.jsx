import React, { useState } from 'react';
import { Scissors } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import AddJobModal from '../components/jobs/AddJobModal';

export default function Jobs({ jobs, setJobs, customers, showAddJob, setShowAddJob }) {
  const handleAddJob = (newJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Scissors size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Jobs & Orders</h1>
      </div>

      <JobList jobs={jobs} onAddJob={() => setShowAddJob(true)} />

      <AddJobModal
        isOpen={showAddJob}
        onClose={() => setShowAddJob(false)}
        onSave={handleAddJob}
        customers={customers}
      />
    </div>
  );
}
