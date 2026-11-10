
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
  BarChart3, 
  Settings, 
  ChevronDown,
  Trash2,
  ChevronRight,
  ShoppingBag,
  Layers,
  Users2,
  TrendingUp,
  PackageCheck,
  Calculator,
  Workflow,
  ShieldCheck,
  FileInput,
  FileOutput,
  RefreshCcw,
  History,
  FileBarChart,
  UserCheck,
  HandCoins,
  PackageSearch,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTranslation } from '@/components/LanguageProvider';
import { useSidebar } from '@/components/ui/sidebar';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  children?: { name: string; href: string; icon?: React.ReactNode }[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { lang, t, dir } = useTranslation();
  const { state } = useSidebar();

  const navigation: NavItem[] = [
    {
      name: t.production.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
      children: [{ name: t.production.dashboard, href: '/production' }]
    },
    {
      name: t.production.production,
      icon: <Factory className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'أوامر الإنتاج (WIP)' : 'Production Orders', href: '/production/orders', icon: <Workflow className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'متابعة الإنتاج اليومي' : 'Daily Monitoring', href: '/production/monitoring', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'دليل المنتجات' : 'Products Catalog', href: '/production/products', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
      ]
    },
    {
      name: t.production.vouchers,
      icon: <FileText className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'سندات صرف مواد' : 'Material Issue', href: '/production/vouchers/issue', icon: <FileInput className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'سندات استلام انتاج' : 'Production Receipt', href: '/production/vouchers/receipt', icon: <FileOutput className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'سندات توريد مرتجع' : 'Material Returns', href: '/production/vouchers/return', icon: <RefreshCcw className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'سندات صرف الأجور' : 'Wage Payments', href: '/production/wages', icon: <HandCoins className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'سند تكاليف أخرى' : 'Other Costs', href: '/production/vouchers/costs', icon: <Receipt className="w-3.5 h-3.5" /> },
      ]
    },
    {
      name: t.production.materials,
      icon: <Box className="w-5 h-5" />,
      children: [
        { name: t.production.rawMaterials, href: '/production/materials', icon: <Layers className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'إدارة المستودعات' : 'Warehouses', href: '/production/warehouses', icon: <PackageCheck className="w-3.5 h-3.5" /> },
      ]
    },
    {
      name: t.production.workersAndWages,
      icon: <Users className="w-5 h-5" />,
      children: [
        { name: t.production.workersList, href: '/production/workers', icon: <Users2 className="w-3.5 h-3.5" /> },
        { name: t.production.departments, href: '/production/departments', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
      ]
    },
    {
      name: lang === 'ar' ? 'التقارير والتحليل' : 'Reports & Analytics',
      icon: <FileBarChart className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'تكاليف الأوامر' : 'Order Costing', href: '/production/reports/costs' },
        { name: lang === 'ar' ? 'إنتاجية العمال' : 'Worker Productivity', href: '/production/reports/productivity' },
      ]
    },
    {
      name: t.production.management,
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Users & Permissions', href: '/production/users', icon: <UserCheck className="w-3.5 h-3.5" /> },
        { name: t.production.settings, href: '/production/settings' },
        { name: t.production.trash, href: '/production/trash', icon: <Trash2 className="w-3.5 h-3.5" /> },
      ]
    },
  ];

  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn(
      "flex flex-col h-full premium-gradient text-white/80 transition-all duration-300 border-l border-white/5 shadow-2xl relative overflow-hidden",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none textile-pattern mix-blend-overlay" />

      <div className={cn("mb-10 pt-8 relative z-10", isCollapsed ? "px-4" : "px-8")}>
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-white/20 shrink-0 overflow-hidden p-1 shadow-xl group-hover:scale-105 transition-transform duration-300">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-sm font-black text-white leading-tight uppercase tracking-tight">{t.production.systemTitle}</h2>
              <p className="text-[10px] text-emerald-200/50 font-bold uppercase tracking-widest mt-0.5">{t.production.cooperative}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto overflow-x-hidden no-scrollbar relative z-10">
        {navigation.map((group) => (
          <Collapsible key={group.name} defaultOpen={pathname.startsWith(group.children?.[0]?.href?.split('/')?.slice(0,3)?.join('/') || '---')}>
            <CollapsibleTrigger disabled={isCollapsed} className={cn(
              "flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/10 hover:text-white transition-all group",
              isCollapsed && "justify-center"
            )}>
              <div className="flex items-center gap-3">
                <span className="text-emerald-100/40 group-hover:text-white transition-colors">{group.icon}</span>
                {!isCollapsed && <span className="text-xs font-black animate-in fade-in duration-500">{group.name}</span>}
              </div>
              {!isCollapsed && <ChevronDown className="w-3 h-3 text-emerald-100/30 transition-transform duration-200" />}
            </CollapsibleTrigger>
            {!isCollapsed && (
              <CollapsibleContent className="space-y-1 mt-1 pr-10 rtl:pr-10 ltr:pl-10">
                {group.children?.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg text-[11px] font-bold transition-all relative",
                      pathname === item.href 
                        ? "text-white bg-white/10 shadow-inner" 
                        : "text-emerald-100/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {pathname === item.href && (
                      <span className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-400 rounded-full",
                        dir === 'rtl' ? "right-0" : "left-0"
                      )} />
                    )}
                    {item.name}
                  </Link>
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ))}
      </nav>

      <div className={cn("pt-6 mt-6 border-t border-white/10 pb-8 relative z-10 px-6")}>
        <Link href="/" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <History className="w-3 h-3" />
          {!isCollapsed && <span>{t.production.backToSite}</span>}
        </Link>
      </div>
    </div>
  );
}
