'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/production/Sidebar';
import { Header } from '@/components/production/Header';
import { useTranslation } from '@/components/LanguageProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  const initialLoadRef = useRef(false);
  const lastAppliedDbLangRef = useRef<string | null>(null);

  // جلب إعدادات النظام وبيانات صلاحيات المستخدم
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const userProfileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user]);
  
  const { data: settings } = useDoc<any>(settingsRef);
  const { data: userProfile, loading: profileLoading } = useDoc<any>(userProfileRef);

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

  // حماية الواجهات بناءً على صلاحيات القراءة
  const isAuthorized = useMemo(() => {
    if (pathname === '/production/login' || pathname === '/production') return true;
    if (profileLoading || !userProfile) return true; // بانتظار التحميل
    if (userProfile.role === 'admin') return true;

    // تحديد الموديول بناءً على الرابط
    const moduleMap: Record<string, string> = {
      '/production/orders': 'orders',
      '/production/products': 'products',
      '/production/materials': 'materials',
      '/production/warehouses': 'materials',
      '/production/vouchers/issue': 'vouchers_issue',
      '/production/vouchers/receipt': 'vouchers_receipt',
      '/production/vouchers/return': 'vouchers_return',
      '/production/wages': 'wages',
      '/production/vouchers/costs': 'overhead',
      '/production/workers': 'workers',
      '/production/departments': 'workers',
      '/production/reports': 'reports',
      '/production/users': 'settings',
      '/production/settings': 'settings',
      '/production/trash': 'trash'
    };

    const activeModule = Object.entries(moduleMap).find(([path]) => pathname.startsWith(path))?.[1];
    if (!activeModule) return true;

    return userProfile.permissions?.[activeModule]?.read === true;
  }, [pathname, userProfile, profileLoading]);

  // تطبيق إعدادات الثيم واللغة المفضلة
  useEffect(() => {
    if (settings && !isAuthChecking && user) {
      if (settings.themeMode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');

      if (!initialLoadRef.current) {
        if (settings.defaultLanguage && settings.defaultLanguage !== lang) setLang(settings.defaultLanguage as any);
        lastAppliedDbLangRef.current = settings.defaultLanguage;
        initialLoadRef.current = true;
      } else if (settings.defaultLanguage !== lastAppliedDbLangRef.current) {
        setLang(settings.defaultLanguage as any);
        lastAppliedDbLangRef.current = settings.defaultLanguage;
      }
    }
    return () => { document.documentElement.classList.remove('dark'); };
  }, [settings, isAuthChecking, user, setLang, lang]);

  if (authLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] animate-pulse">
            {lang === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying Access...'}
          </p>
        </div>
      </div>
    );
  }

  if (pathname === '/production/login') {
    return <div className={lang === 'ar' ? 'arabic-font' : 'english-font'} dir={dir}>{children}</div>;
  }

  // عرض صفحة "ممنوع الدخول" إذا لم تكن هناك صلاحية
  if (!isAuthorized && !profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center" dir={dir}>
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-600 mb-6 border-4 border-white dark:border-slate-800 shadow-xl">
           <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
          {lang === 'ar' ? 'عذراً، لا تمتلك صلاحية الدخول' : 'Access Denied'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mb-8">
          {lang === 'ar' 
            ? 'تم تقييد وصولك لهذه الواجهة من قبل إدارة النظام. يرجى مراجعة المسؤول إذا كنت تعتقد أن هذا خطأ.' 
            : 'You do not have permission to view this module. Please contact your administrator.'}
        </p>
        <Button onClick={() => router.push('/production')} className="premium-gradient px-8 h-12 rounded-xl font-black shadow-lg">
          {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Dashboard'}
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={`h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden ${lang === 'ar' ? 'arabic-font' : 'english-font'}`} dir={dir}>
        <div className="flex flex-1 overflow-hidden h-full">
          <aside className="z-30 h-full"><Sidebar /></aside>
          <div className="flex-1 flex flex-col min-w-0 h-full relative border-r border-gray-100/50 dark:border-white/5 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      </div>
    </SidebarProvider>
  );
}
