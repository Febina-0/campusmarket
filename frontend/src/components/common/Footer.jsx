import React from 'react';
import { ShoppingBag, ShieldCheck, Heart, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Campus<span className="text-indigo-600">Market</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm mb-4">
              The official, peer-to-peer campus marketplace where verified college students can safely buy, sell, and reserve textbooks, cycles, stationery, and electronics.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> College Verified
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-4 h-4 text-indigo-600" /> Real-time Updates
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/" className="hover:text-indigo-600 transition-colors">All Products</Link>
              </li>
              <li>
                <Link to="/products/new" className="hover:text-indigo-600 transition-colors">Post an Ad</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-indigo-600 transition-colors">Wishlist</Link>
              </li>
              <li>
                <Link to="/reservations" className="hover:text-indigo-600 transition-colors">Reservations</Link>
              </li>
            </ul>
          </div>

          {/* Safety & Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Trust & Safety
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Meet on campus during daytime</li>
              <li>Inspect items before confirming handover</li>
              <li>Pay via UPI or Cash on pickup</li>
              <li>Instant in-app notifications</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Campus Marketplace. Built for students.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for campus community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
