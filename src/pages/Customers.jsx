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
  const customers = custRes?.data && Array.isArray(custRes.data) ? custRes.data : [];

  const handleAddCustomer = async (formData) => {
    await customersApi.create(formData);
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
      />
    </div>
  );
}
