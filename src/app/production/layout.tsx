'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/production/Sidebar';
import { Header } from '@/components/production/Header';
import { useTranslation } from '@/components/LanguageProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dir, lang, setLang } = useTranslation();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Track original language to restore when leaving production
  const originalLangRef = useRef<any>(null);
  const appliedSettingsRef = useRef(false);

  // Fetch Isolated Production Settings
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    if (!authLoading) {
      if (!user && pathname !== '/production/login') {
        router.push('/production/login');
      } else if (user && pathname === '/production/login') {
        router.push('/production');
      }
      setIsAuthChecking(false);
    }
  }, [user, authLoading, pathname, router]);

  // Apply Isolated Production Settings (Theme & Language)
  useEffect(() => {
    if (settings && !isAuthChecking && user) {
      // 1. Theme Management (Only in Production)
      if (settings.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Language Management (Isolation logic)
      if (!appliedSettingsRef.current) {
        originalLangRef.current = lang; // Store site language before changing
        if (settings.defaultLanguage && settings.defaultLanguage !== lang) {
          setLang(settings.defaultLanguage as any);
        }
        appliedSettingsRef.current = true;
      }
    }

    // Cleanup: Restore site defaults when leaving production
    return () => {
      document.documentElement.classList.remove('dark');
      // Note: We don't forcefully revert language on every re-render, 
      // but if the component unmounts entirely (leaving /production),
      // the RootLayout will take over again.
    };
  }, [settings, isAuthChecking, user, setLang]);

  if (authLoading || isAuthChecking) {
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
      <div 
        className={`h-screen w-full bg-[#F8F9FA] dark:bg-[#0F172A] text-[#1A1C1E] dark:text-[#F8F9FA] flex flex-col overflow-hidden ${lang === 'ar' ? 'arabic-font' : 'english-font'}`} 
        dir={dir}
      >
        <div className="flex flex-1 overflow-hidden h-full">
          {/* Fixed Sidebar */}
          <aside className="z-30 h-full">
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative border-r border-gray-100/50 dark:border-white/5 overflow-hidden">
            {/* Fixed Header */}
            <Header />
            
            {/* Main Part */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
        
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Dark Mode Overrides for standard cards in Production */
          .dark .bg-white { background-color: #1E293B !important; }
          .dark .text-slate-900 { color: #F8F9FA !important; }
          .dark .text-slate-600 { color: #94A3B8 !important; }
          .dark .border-slate-200 { border-color: #334155 !important; }
          .dark .bg-slate-50 { background-color: #0F172A !important; }
          .dark .bg-slate-100 { background-color: #334155 !important; }
        `}</style>
      </div>
    </SidebarProvider>
  );
}
