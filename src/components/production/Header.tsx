
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Calendar,
  Settings,
  Globe,
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 z-20">
      {/* Sidebar Toggle & Global Search Area */}
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-primary rounded-xl"
        >
          <PanelLeft className="w-6 h-6" />
        </Button>

        <div className="hidden md:flex flex-1 max-w-lg relative group">
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors`} />
          <Input 
            placeholder={t.production.searchPlaceholder}
            className={`${lang === 'ar' ? 'pr-12' : 'pl-12'} h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary transition-all rounded-[1rem] text-sm font-medium`}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Professional Date Label */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-black text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <Calendar className="w-4 h-4 text-primary/40" />
          <span suppressHydrationWarning className="tabular-nums">
            {mounted ? today : '...'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-gray-400 hover:text-primary rounded-lg h-9 w-9"
          >
            <Globe className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary rounded-lg h-9 w-9 relative">
            <Bell className="w-5 h-5" />
            <span className={`absolute top-2.5 ${lang === 'ar' ? 'left-2.5' : 'right-2.5'} w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm`}></span>
          </Button>
        </div>

        {/* Premium User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`flex items-center gap-3 p-1.5 ${lang === 'ar' ? 'md:ps-5 md:pe-2' : 'md:pe-5 md:ps-2'} hover:bg-gray-50 rounded-[1.25rem] border border-transparent hover:border-gray-100 transition-all`}>
              <div className="hidden md:block text-right">
                <p className="text-xs font-black text-gray-900 leading-none">{lang === 'ar' ? 'علي باحاج' : 'Ali Bahaj'}</p>
                <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest opacity-60">
                  {lang === 'ar' ? 'المشرف العام' : 'General Manager'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5 shadow-inner">
                <User className="w-6 h-6" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={lang === 'ar' ? 'end' : 'start'} className="w-64 rounded-2xl border-gray-100 shadow-2xl p-2 mt-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-3">{t.production.userProfile}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem className="text-sm font-bold gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><User className="w-4 h-4" /></div>
              {t.production.userProfile}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-bold gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><Settings className="w-4 h-4" /></div>
              {t.production.settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem 
              className="text-sm font-bold gap-4 text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer p-3 rounded-xl"
              onClick={handleLogout}
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
              {t.production.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
