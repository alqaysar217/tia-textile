'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/production/Sidebar';
import { Header } from '@/components/production/Header';
import { useTranslation } from '@/components/LanguageProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dir, lang } = useTranslation();
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/production/login') {
        router.push('/production/login');
      } else if (user && pathname === '/production/login') {
        router.push('/production');
      }
      setIsAuthChecking(false);
    }
  }, [user, loading, pathname, router]);

  if (loading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse">
            {lang === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying Access...'}
          </p>
        </div>
      </div>
    );
  }

  // If we are on the login page, don't show the dashboard shell
  if (pathname === '/production/login') {
    return (
      <div className={lang === 'ar' ? 'arabic-font' : 'english-font'} dir={dir}>
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Root Container: h-screen prevents overall body scroll */}
      <div 
        className={`h-screen w-full bg-[#F8F9FA] text-[#1A1C1E] flex flex-col overflow-hidden ${lang === 'ar' ? 'arabic-font' : 'english-font'}`} 
        dir={dir}
      >
        <div className="flex flex-1 overflow-hidden h-full">
          {/* Fixed Sidebar */}
          <aside className="z-30 h-full">
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative border-r border-gray-100/50 overflow-hidden">
            {/* Fixed Header */}
            <Header />
            
            {/* Main Part - Hidden overflow here allows child to control its own scrolling */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
        
        <style jsx global>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .production-card {
            @apply bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300;
          }
          .production-table-header {
            @apply bg-gray-50/80 text-gray-500 font-black text-[10px] uppercase tracking-[0.1em] px-4 py-4 border-b border-gray-200/60;
          }
          .production-table-cell {
            @apply px-4 py-4 border-b border-gray-100 text-sm font-medium;
          }
          .status-badge {
            @apply inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider;
          }
          .btn-production {
            @apply h-11 px-6 rounded-lg font-black transition-all active:scale-95 shadow-sm;
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
}
