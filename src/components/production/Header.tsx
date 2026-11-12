'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  LogOut, 
  Calendar,
  Settings,
  Globe,
  PanelLeft,
  Sparkles,
  UserCircle,
  Moon,
  Sun,
  Shield,
  Mail,
  BadgeCheck,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/components/LanguageProvider';
import { useAuth, useFirestore, useDoc, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ProductionAI } from './ProductionAI';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState('');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const { lang, setLang, t } = useTranslation();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { user: authUser } = useUser();

  // Fetch Actual User Document from Firestore
  const userDocRef = useMemo(() => 
    (!db || !authUser) ? null : doc(db, 'users', authUser.uid), 
    [db, authUser]
  );
  const { data: userProfile, loading: profileLoading } = useDoc<any>(userDocRef);

  // Fetch current theme from settings
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    setMounted(true);
    setToday(new Date().toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, [lang]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/production/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeToggle = async () => {
    if (!db) return;
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        themeMode: newTheme,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };

  const isRtl = lang === 'ar';
  const isDarkMode = mounted && (settings?.themeMode === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')));

  // Fallback data if profile not yet loaded or doesn't exist
  const displayName = userProfile?.fullName || authUser?.displayName || (isRtl ? 'مستخدم النظام' : 'System User');
  const displayRole = userProfile?.role || 'staff';
  const displayPhoto = userProfile?.photoUrl || authUser?.photoURL || 'https://picsum.photos/seed/user/200/200';

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 z-20 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
        >
          <PanelLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-emerald-600/40" />
          <span suppressHydrationWarning className="tabular-nums uppercase tracking-wider">
            {mounted ? today : '...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsAIOpen(true)}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg h-9 w-9 transition-all"
            title={isRtl ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
          >
            <Sparkles className="w-5 h-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleThemeToggle}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg h-9 w-9 transition-all"
            title={isRtl ? 'تبديل المظهر' : 'Toggle Theme'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg h-9 w-9 transition-all"
            title={isRtl ? 'تغيير اللغة' : 'Change Language'}
          >
            <Globe className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "flex items-center gap-3 p-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group",
              isRtl ? "ps-4 pe-1" : "pe-4 ps-1"
            )}>
              <div className="hidden md:flex flex-col text-right">
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {displayName}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                  {displayRole === 'admin' ? (isRtl ? 'مدير النظام' : 'Administrator') : 
                   displayRole === 'manager' ? (isRtl ? 'مدير إنتاج' : 'Manager') : 
                   (isRtl ? 'موظف تشغيل' : 'Staff')}
                </p>
              </div>
              <Avatar className="h-10 w-10 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                <AvatarImage src={displayPhoto} className="object-cover" />
                <AvatarFallback className="bg-emerald-600 text-white font-black text-xs uppercase">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? 'end' : 'start'} className="w-56 rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-1.5 mt-2" dir={isRtl ? 'rtl' : 'ltr'}>
            <DropdownMenuItem 
              className="text-xs font-bold gap-3 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:text-emerald-700 dark:focus:text-emerald-400 cursor-pointer p-2.5 rounded-lg"
              onClick={() => setIsProfileOpen(true)}
            >
              <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><User className="w-4 h-4" /></div>
              {isRtl ? 'الملف الشخصي' : 'My Profile'}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800 my-1.5" />
            
            <DropdownMenuItem 
              className="text-xs font-bold gap-3 text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 focus:text-rose-700 cursor-pointer p-2.5 rounded-lg"
              onClick={handleLogout}
            >
              <div className="w-7 h-7 rounded-md bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600"><LogOut className="w-4 h-4" /></div>
              {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* PROFILE DIALOG */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[1.5rem] shadow-2xl dark:bg-slate-900">
           <div className="premium-gradient p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><UserCircle className="w-40 h-40 text-white" /></div>
              <div className="relative z-10 flex flex-col items-center">
                 <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl mb-4">
                    <AvatarImage src={displayPhoto} className="object-cover" />
                    <AvatarFallback className="bg-white text-emerald-900 font-black text-xl">{displayName.charAt(0)}</AvatarFallback>
                 </Avatar>
                 <h3 className="text-xl font-black">{displayName}</h3>
                 <Badge variant="secondary" className="bg-white/10 text-emerald-200 border-none px-3 mt-2 text-[10px] font-black uppercase tracking-widest">
                    {displayRole}
                 </Badge>
              </div>
           </div>
           
           <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
              <div className="space-y-4">
                 <div className="flex items-center gap-4 text-right">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0"><Mail className="w-5 h-5" /></div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tabular-nums">{authUser?.email}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 text-right">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0"><Shield className="w-5 h-5" /></div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'صلاحيات النظام' : 'SYSTEM ACCESS'}</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {displayRole === 'admin' ? (isRtl ? 'دخول كامل (مدير)' : 'Full Administrative Access') : (isRtl ? 'دخول تشغيلي' : 'Operational Access')}
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 text-right">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0"><BadgeCheck className="w-5 h-5" /></div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'حالة الحساب' : 'ACCOUNT STATUS'}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-sm font-bold text-emerald-600">{isRtl ? 'نشط ومحمي' : 'Active & Secured'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                 <Button 
                   onClick={() => setIsProfileOpen(false)} 
                   className="w-full h-12 rounded-xl font-black text-sm premium-gradient text-white border-none shadow-lg active:scale-95 transition-all"
                 >
                    {isRtl ? 'إغلاق المعاينة' : 'Close Profile'}
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* PRODUCTION AI ASSISTANT DRAWER */}
      <ProductionAI isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </header>
  );
}
