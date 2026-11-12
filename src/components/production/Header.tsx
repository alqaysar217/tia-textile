'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Calendar,
  Settings,
  Globe,
  PanelLeft,
  Sparkles,
  UserCircle
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
import { useSidebar } from '@/components/ui/sidebar';
import { useTranslation } from '@/components/LanguageProvider';
import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState('');
  const { toggleSidebar } = useSidebar();
  const { lang, setLang, t } = useTranslation();
  const auth = useAuth();

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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 z-20 shadow-sm">
      {/* Sidebar Toggle Section */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all"
        >
          <PanelLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Professional Date Label */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-black text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600/40" />
          <span suppressHydrationWarning className="tabular-nums uppercase tracking-wider">
            {mounted ? today : '...'}
          </span>
        </div>

        {/* System Tools Actions */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {/* AI ASSISTANT ICON */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg h-9 w-9 transition-all"
            title={lang === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
          >
            <Sparkles className="w-5 h-5" />
          </Button>

          {/* LANGUAGE TOGGLE */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg h-9 w-9 transition-all"
            title={lang === 'ar' ? 'تغيير اللغة' : 'Change Language'}
          >
            <Globe className="w-5 h-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-100 mx-1" />

        {/* Premium User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "flex items-center gap-3 p-1 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group",
              isRtl ? "ps-4 pe-1" : "pe-4 ps-1"
            )}>
              <div className="hidden md:flex flex-col text-right">
                <p className="text-xs font-black text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">
                  {lang === 'ar' ? 'علي باحاج' : 'Ali Bahaj'}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                  {lang === 'ar' ? 'المشرف العام' : 'General Manager'}
                </p>
              </div>
              <Avatar className="h-10 w-10 rounded-lg border-2 border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src="https://picsum.photos/seed/manager/200/200" className="object-cover" />
                <AvatarFallback className="bg-emerald-600 text-white font-black text-xs uppercase">
                  AB
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? 'end' : 'start'} className="w-56 rounded-xl border-slate-100 shadow-2xl p-1.5 mt-2" dir={isRtl ? 'rtl' : 'ltr'}>
            <DropdownMenuItem className="text-xs font-bold gap-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer p-2.5 rounded-lg">
              <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600"><User className="w-4 h-4" /></div>
              {lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-slate-50 my-1.5" />
            
            <DropdownMenuItem 
              className="text-xs font-bold gap-3 text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer p-2.5 rounded-lg"
              onClick={handleLogout}
            >
              <div className="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center text-rose-600"><LogOut className="w-4 h-4" /></div>
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
