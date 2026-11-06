
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  LogOut, 
  HelpCircle, 
  Calendar,
  Settings,
  Globe
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
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState('');

  useEffect(() => {
    setMounted(true);
    setToday(new Date().toLocaleDateString('ar-YE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 z-20">
      {/* Mobile Sidebar Trigger */}
      <div className="flex lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72 border-none bg-primary">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Global Search Area */}
      <div className="hidden md:flex flex-1 max-w-lg relative group">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="ابحث عن أمر إنتاج، عامل، أو سند..."
          className="pr-12 h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary transition-all rounded-[1rem] text-sm font-medium"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Professional Date Label */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-black text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <Calendar className="w-4 h-4 text-primary/40" />
          <span suppressHydrationWarning className="tabular-nums">
            {mounted ? today : 'جارِ التحميل...'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary rounded-lg h-9 w-9">
            <Globe className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary rounded-lg h-9 w-9 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          </Button>
        </div>

        {/* Premium User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 p-1.5 md:ps-5 md:pe-2 hover:bg-gray-50 rounded-[1.25rem] border border-transparent hover:border-gray-100 transition-all">
              <div className="hidden md:block text-right">
                <p className="text-xs font-black text-gray-900 leading-none">علي باحاج</p>
                <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest opacity-60">المشرف العام</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5 shadow-inner">
                <User className="w-6 h-6" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-gray-100 shadow-2xl arabic-font p-2 mt-2" dir="rtl">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-3">إدارة الحساب</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem className="text-sm font-bold gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><User className="w-4 h-4" /></div>
              ملف المستخدم
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-bold gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><Settings className="w-4 h-4" /></div>
              الإعدادات الشخصية
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem className="text-sm font-bold gap-4 text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
