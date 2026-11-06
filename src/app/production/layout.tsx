
'use client';

import React from 'react';
import { Sidebar } from '@/components/production/Sidebar';
import { Header } from '@/components/production/Header';
import { useTranslation } from '@/components/LanguageProvider';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dir, lang } = useTranslation();

  return (
    <SidebarProvider>
      <div 
        className={`min-h-screen w-full bg-[#F8F9FA] text-[#1A1C1E] flex flex-col ${lang === 'ar' ? 'arabic-font' : 'english-font'}`} 
        dir={dir}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Main Sidebar Wrapper */}
          <aside className="z-30">
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
            @apply bg-gray-50/50 text-gray-500 font-black text-[10px] uppercase tracking-[0.1em] px-4 py-4 border-b border-gray-100;
          }
          .production-table-cell {
            @apply px-4 py-4 border-b border-gray-50 text-sm font-medium;
          }
          .status-badge {
            @apply inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider;
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
}
