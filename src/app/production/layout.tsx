'use client';

import React from 'react';
import { Sidebar } from '@/components/production/Sidebar';
import { Header } from '@/components/production/Header';

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#343A40] flex flex-col arabic-font" dir="rtl">
      {/* Sidebar Navigation */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex w-72 flex-col bg-white border-l border-gray-200 shadow-sm z-30 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
      
      {/* Scope styles specifically for production dashboard */}
      <style jsx global>{`
        .production-card {
          @apply bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all;
        }
        .production-table-header {
          @apply bg-gray-50 text-gray-500 font-black text-[10px] uppercase tracking-widest px-4 py-3 text-right;
        }
        .production-table-cell {
          @apply px-4 py-3 border-b border-gray-50 text-sm font-medium;
        }
        .status-badge {
          @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest;
        }
      `}</style>
    </div>
  );
}
