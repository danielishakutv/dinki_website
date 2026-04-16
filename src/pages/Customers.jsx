import React, { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import CustomerList from '../components/customers/CustomerList';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import { customers as customersApi } from '../lib/api';
import { useApi, invalidateCache, TTL } from '../hooks/useApi';

export default function Customers() {
  const [showAdd, setShowAdd] = useState(false);

  const { data: custRes, loading, refresh } = useApi(
    'customers-list', () => customersApi.list({ limit: 100 }), { ttl: TTL.medium }
  );
  const raw = custRes?.data;
  const customers = Array.isArray(raw) ? raw : Array.isArray(raw?.customers) ? raw.customers : [];

  const handleAddCustomer = async (formData) => {
    const result = await customersApi.create(formData);
    // If the backend found a matching user, return the result for confirmation
    if (result?.data?.requires_confirmation) {
      return result.data;
    }
    invalidateCache('customers');
    refresh();
  };

  const handleLinkCustomer = async (linkData) => {
    await customersApi.link(linkData);
    invalidateCache('customers');
    refresh();
  };

  const handleForceCreate = async (formData) => {
    await customersApi.forceCreate(formData);
    invalidateCache('customers');
    refresh();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Customers</h1>
      </div>

      <CustomerList customers={customers} onAddCustomer={() => setShowAdd(true)} loading={loading} />

      <AddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAddCustomer}
        onLink={handleLinkCustomer}
        onForceCreate={handleForceCreate}
      />
    </div>
  );
}
