import React, { useState, useEffect, useCallback } from 'react';
import { Users, Loader2 } from 'lucide-react';
import CustomerList from '../components/customers/CustomerList';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import { customers as customersApi } from '../lib/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersApi.list({ limit: 100 });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const handleAddCustomer = async (formData) => {
    try {
      await customersApi.create(formData);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
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
