'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  LogOut, 
  Maximize,
  HelpCircle,
  Calendar
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
  const today = new Date().toLocaleDateString('ar-YE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-20">
      {/* Mobile Sidebar */}
      <div className="flex lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72 border-none">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-md relative group">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="البحث عن أمر إنتاج، عامل، أو سند..."
          className="pr-10 h-10 bg-gray-50 border-transparent focus:bg-white focus:ring-primary/20 transition-all rounded-xl text-sm"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
          <Calendar className="w-3 h-3" />
          {today}
        </div>

        {/* Support */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary rounded-xl">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary rounded-xl">
            <Bell className="w-5 h-5" />
          </Button>
          <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-1 md:ps-4 md:pe-2 hover:bg-gray-50 rounded-xl">
              <div className="hidden md:block text-left text-right">
                <p className="text-[11px] font-black leading-none">علي باحاج</p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">المشرف العام</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 shadow-xl arabic-font" dir="rtl">
            <DropdownMenuLabel className="text-xs font-black">حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm font-bold gap-3 focus:bg-primary/5 focus:text-primary cursor-pointer p-2.5">
              <User className="w-4 h-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm font-bold gap-3 focus:bg-primary/5 focus:text-primary cursor-pointer p-2.5">
              <Settings className="w-4 h-4" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm font-bold gap-3 text-red-500 focus:bg-red-50 cursor-pointer p-2.5">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
