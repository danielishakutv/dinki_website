import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import CustomerList from '../components/customers/CustomerList';
import { useCustomers } from '../hooks/useLocal';
import SyncStatusPill from '../components/SyncStatusPill';

export default function Customers() {
  const navigate = useNavigate();

  // Reads straight from the device. There is no error state and no "try again"
  // button any more, because there is no request to fail — the list is already
  // here whether or not there's a network. The sync pill is the only place
  // connectivity is mentioned at all.
  const { data: customers, loading } = useCustomers();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-gold-500" />
          <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Customers</h1>
        </div>
        <SyncStatusPill />
      </div>

      <CustomerList
        customers={customers || []}
        onAddCustomer={() => navigate('/customers/new')}
        loading={loading}
      />
    </div>
  );
}
