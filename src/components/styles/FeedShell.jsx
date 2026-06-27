import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import Logo from '../layout/Logo';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Renders public discovery surfaces (Explore, Style detail) inside the right
 * chrome for whoever's looking:
 *  - logged in  → the full app Layout (sidebar / bottom nav / profile)
 *  - logged out → a slim public header with sign-in / join CTAs, so guests can
 *    browse the whole feed and are nudged to join only when they act.
 */
export default function FeedShell({ children }) {
  const { user } = useAuth();

  if (user) {
    return (
      <Layout userRole={user.role}>
        <div className="max-w-6xl mx-auto px-4 py-5">{children}</div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-cloud">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <Link to="/?auth=login" className="px-3.5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">Log in</Link>
            <Link to="/?auth=signup" className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gold-500 hover:bg-gold-600 shadow-sm shadow-gold-500/20 transition">Join free</Link>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-5">{children}</div>

      {/* Footer CTA for guests */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-gold-500 via-gold-500 to-amber-600 p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <h2 className="text-2xl sm:text-3xl font-heading font-bold relative">Save the looks you love</h2>
          <p className="mt-2 text-white/85 max-w-md mx-auto relative">Join Dinki to save styles, follow tailors, and order the exact look you want — made just for you.</p>
          <Link to="/?auth=signup" className="inline-block mt-5 px-6 py-3 bg-white text-gold-600 rounded-xl text-sm font-bold shadow hover:bg-gold-50 transition relative">Create free account</Link>
        </div>
      </div>
    </div>
  );
}
