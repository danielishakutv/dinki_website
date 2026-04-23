import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import CustomerList from '../components/customers/CustomerList';
import { customers as customersApi } from '../lib/api';
import { useApi, TTL } from '../hooks/useApi';

export default function Customers() {
  const navigate = useNavigate();

  const { data: custRes, loading } = useApi(
    'customers-list', () => customersApi.list({ limit: 100 }), { ttl: TTL.medium }
  );
  const raw = custRes?.data;
  const customers = Array.isArray(raw) ? raw : Array.isArray(raw?.customers) ? raw.customers : [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Customers</h1>
      </div>

      <CustomerList
        customers={customers}
        onAddCustomer={() => navigate('/customers/new')}
        loading={loading}
      />
    </div>
  );
}
