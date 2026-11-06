
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Factory, 
  Box, 
  Users, 
  FileText, 
  Calculator, 
  Package, 
  BarChart3, 
  Settings, 
  ChevronDown,
  History,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type NavItem = {
  name: string;
  href?: string;
  icon: React.ReactNode;
  children?: { name: string; href: string }[];
};

export function Sidebar() {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    {
      name: 'الرئيسية',
      icon: <LayoutDashboard className="w-5 h-5" />,
      children: [{ name: 'لوحة التحكم', href: '/production' }]
    },
    {
      name: 'الإنتاج',
      icon: <Factory className="w-5 h-5" />,
      children: [
        { name: 'أوامر الإنتاج', href: '/production/orders' },
        { name: 'مراحل الإنتاج', href: '/production/stages' },
        { name: 'توزيع العمل', href: '/production/assignments' },
        { name: 'متابعة الإنتاج', href: '/production/monitoring' },
        { name: 'الإنتاج تحت التشغيل (WIP)', href: '/production/wip' },
      ]
    },
    {
      name: 'المواد والمخازن',
      icon: <Box className="w-5 h-5" />,
      children: [
        { name: 'المواد الخام', href: '/production/materials' },
        { name: 'المستودعات', href: '/production/warehouses' },
        { name: 'سندات الصرف', href: '/production/issue-vouchers' },
        { name: 'حركة المخزون', href: '/production/inventory-moves' },
      ]
    },
    {
      name: 'العمال والأجور',
      icon: <Users className="w-5 h-5" />,
      children: [
        { name: 'قائمة العمال', href: '/production/workers' },
        { name: 'الأقسام', href: '/production/departments' },
        { name: 'استحقاقات الأجور', href: '/production/wage-entitlements' },
      ]
    },
    {
      name: 'السندات',
      icon: <FileText className="w-5 h-5" />,
      children: [
        { name: 'جميع السندات', href: '/production/vouchers' },
        { name: 'استلام الإنتاج', href: '/production/receipt-vouchers' },
        { name: 'التحويل بين الأقسام', href: '/production/transfers' },
      ]
    },
    {
      name: 'التقارير',
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        { name: 'تقارير الإنتاج', href: '/production/reports/production' },
        { name: 'تقارير التكاليف', href: '/production/reports/costs' },
      ]
    },
    {
      name: 'الإدارة',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: 'الأدوار والصلاحيات', href: '/production/roles' },
        { name: 'الإعدادات العامة', href: '/production/settings' },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full py-8 text-white/80">
      {/* Brand Section */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-300">
            <Factory className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight uppercase tracking-tight">إدارة الإنتاج</h2>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">الجمعية النسيجية</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4">
        {navigation.map((group) => (
          <Collapsible key={group.name} defaultOpen={group.name === 'الرئيسية' || group.name === 'الإنتاج'}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 hover:text-white transition-all group">
              <div className="flex items-center gap-3">
                <span className="text-white/40 group-hover:text-white transition-colors">{group.icon}</span>
                <span className="text-xs font-black">{group.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-white/30 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1 pr-10">
              {group.children?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-lg text-[11px] font-bold transition-all relative",
                    pathname === item.href 
                      ? "text-white bg-white/10" 
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {pathname === item.href && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-secondary rounded-l-full" />
                  )}
                  {item.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* Footer Info Area */}
      <div className="px-6 pt-6 mt-6 border-t border-white/5">
        <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary text-xs font-black border border-secondary/20">
              ع
            </div>
            <div>
              <p className="text-xs font-black text-white">علي باحاج</p>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">مدير الإنتاج</p>
            </div>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black text-white/60 hover:text-white bg-white/5 rounded-xl transition-all">
            <History className="w-3 h-3" />
            العودة للموقع العام
          </Link>
        </div>
      </div>
    </div>
  );
}
