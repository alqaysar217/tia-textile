
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
    <div className="min-h-screen bg-[#F0F2F5] text-[#1A1C1E] flex flex-col arabic-font" dir="rtl">
      <div className="flex flex-1 overflow-hidden">
        {/* Modern Sidebar with Primary Background */}
        <aside className="hidden lg:flex w-72 flex-col bg-primary border-l border-white/5 shadow-2xl z-30 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
            {children}
          </main>
        </div>
      </div>
      
      <style jsx global>{`
        .production-card {
          @apply bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-all duration-300;
        }
        .production-table-header {
          @apply bg-gray-50/50 text-gray-500 font-black text-[10px] uppercase tracking-[0.1em] px-4 py-4 text-right border-b border-gray-100;
        }
        .production-table-cell {
          @apply px-4 py-4 border-b border-gray-50 text-sm font-medium;
        }
        .status-badge {
          @apply inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider;
        }
      `}</style>
    </div>
  );
}
