import React, { useState } from 'react';
import { Users } from 'lucide-react';
import CustomerList from '../components/customers/CustomerList';
import AddCustomerModal from '../components/customers/AddCustomerModal';

export default function Customers({ customers, setCustomers }) {
  const [showAdd, setShowAdd] = useState(false);

  const handleAddCustomer = (newCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Customers</h1>
      </div>

      <CustomerList customers={customers} onAddCustomer={() => setShowAdd(true)} />

      <AddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAddCustomer}
      />
    </div>
  );
}
