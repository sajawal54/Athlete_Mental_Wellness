import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { ExclamationTriangleIcon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 flex">
      {/* 1. Sidebar (Primary navigation, active states, collapsed desktop, mobile drawer, role-aware) */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all">
        {/* 2. Top Navigation (Page title, search, notification, user menu, contextual actions) */}
        <TopNav setSidebarOpen={setSidebarOpen} />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* 3. Footer (Support links, privacy, terms, version, and optional emergency shortcut) */}
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Athlete Mental Wellness Platform. Version 2.4 Pro.</p>
          <div className="flex items-center gap-6 font-medium text-slate-600">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Terms</span>
            {/* Optional Emergency Shortcut Button */}
            <button 
              onClick={() => setEmergencyModal(true)}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-all hover:shadow-sm"
            >
              <ExclamationTriangleIcon className="w-4 h-4 animate-bounce" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </footer>
      </div>

      {/* ================= EMERGENCY QUICK MODAL ================= */}
      {emergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 relative">
            <button 
              onClick={() => setEmergencyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Emergency Crisis Support</h3>
                <p className="text-[11px] text-rose-600 font-semibold">Immediate Assistance Helpline</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              If you are experiencing a mental health emergency or severe distress, please reach out immediately to our 24/7 dedicated support team or emergency counselor hotline.
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Crisis Helpline</p>
                  <p className="text-xs font-extrabold text-slate-800">1-800-WELLNESS (24/7)</p>
                </div>
                <a href="tel:18009355637" className="p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md">
                  <PhoneIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            <button 
              onClick={() => setEmergencyModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}