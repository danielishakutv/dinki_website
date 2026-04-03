import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Palette, Gavel, CreditCard } from 'lucide-react';
import { marketplaceStyles, fabricStore } from '../data/mockData';
import StyleGallery from '../components/marketplace/StyleGallery';
import FabricStore from '../components/marketplace/FabricStore';
import ComingSoon from '../components/marketplace/ComingSoon';

const tabs = [
  { id: 'styles', label: 'Style Gallery', icon: Palette },
  { id: 'fabrics', label: 'Fabric Store', icon: ShoppingBag },
  { id: 'bidding', label: 'Bidding', icon: Gavel },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('styles');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag size={22} className="text-gold-500" />
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Marketplace</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-gold-500 text-white shadow-sm shadow-gold-500/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gold-200'
              }`}
            >
              <tab.icon size={16} className="flex-shrink-0" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'styles' && <StyleGallery styles={marketplaceStyles} />}
          {activeTab === 'fabrics' && <FabricStore fabrics={fabricStore} />}
          {activeTab === 'bidding' && (
            <ComingSoon
              title="Bidding System"
              description="Soon, tailors will be able to bid on customer requests. Get competitive quotes and find the perfect tailor for your style."
              icon={Gavel}
            />
          )}
          {activeTab === 'payments' && (
            <ComingSoon
              title="Payment Gateway"
              description="Secure payments, escrow protection, and seamless transactions. Pay safely for your custom African fashion."
              icon={CreditCard}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
