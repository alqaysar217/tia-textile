
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
  Settings, 
  ChevronDown,
  Trash2,
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
  Receipt,
  PieChart,
  CheckCircle2,
  Settings2,
  Users as UsersIcon
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
  children?: { name: string; href: string; icon: React.ReactNode }[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { lang, t, dir } = useTranslation();
  const { state } = useSidebar();

  const navigation: NavItem[] = [
    {
      name: t.production.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
      children: [{ name: t.production.dashboard, href: '/production', icon: <LayoutDashboard className="w-3.5 h-3.5" /> }]
    },
    {
      name: t.production.production,
      icon: <Factory className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'أوامر الإنتاج (WIP)' : 'Production Orders', href: '/production/orders', icon: <Workflow className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'الأوامر المكتملة' : 'Completed Orders', href: '/production/orders/completed', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
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
        { name: lang === 'ar' ? 'مستودع المنجز الجاهز' : 'Finished Goods Wh', href: '/production/warehouses/finished-goods', icon: <PackageCheck className="w-3.5 h-3.5" /> },
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
        { name: lang === 'ar' ? 'إنتاجية وأجور العمال' : 'Worker Performance', href: '/production/reports/productivity', icon: <UserCheck className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'تحليل تكاليف الأوامر' : 'Order Cost Analysis', href: '/production/reports/costs', icon: <Calculator className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'استهلاك المواد الخام' : 'Material Consumption', href: '/production/reports/materials', icon: <PieChart className="w-3.5 h-3.5" /> },
        { name: lang === 'ar' ? 'الملخص المالي والنمو' : 'Financial Summary', href: '/production/reports/financial', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      ]
    },
    {
      name: t.production.management,
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Users & Permissions', href: '/production/users', icon: <UserCheck className="w-3.5 h-3.5" /> },
        { name: t.production.settings, href: '/production/settings', icon: <Settings2 className="w-3.5 h-3.5" /> },
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
        {navigation.map((group) => {
          const isGroupActive = group.children?.some(child => pathname === child.href);
          
          return (
            <Collapsible 
              key={group.name} 
              defaultOpen={pathname.startsWith(group.children?.[0]?.href?.split('/')?.slice(0,3)?.join('/') || '---')}
            >
              <CollapsibleTrigger 
                disabled={isCollapsed} 
                className={cn(
                  "flex items-center justify-between w-full p-3 rounded-xl transition-all group",
                  isCollapsed ? "justify-center" : "hover:bg-white/10",
                  isGroupActive && !isCollapsed && "bg-white/5 text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "transition-colors",
                    isGroupActive ? "text-emerald-400" : "text-emerald-100/40 group-hover:text-white"
                  )}>{group.icon}</span>
                  {!isCollapsed && <span className={cn("text-[11px] font-black uppercase tracking-wider animate-in fade-in duration-500", isGroupActive ? "text-white" : "text-emerald-100/60")}>{group.name}</span>}
                </div>
                {!isCollapsed && <ChevronDown className={cn("w-3 h-3 text-emerald-100/30 transition-transform duration-200", isGroupActive && "rotate-180 text-emerald-400")} />}
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="space-y-1 mt-1 px-2">
                  {group.children?.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all relative group/item",
                          isActive 
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-950/20" 
                            : "text-emerald-100/40 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className={cn(
                          "shrink-0 transition-transform group-hover/item:scale-110",
                          isActive ? "text-white" : "text-emerald-100/20 group-hover/item:text-emerald-400"
                        )}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <span className={cn(
                            "absolute w-1 h-4 bg-white rounded-full",
                            dir === 'rtl' ? "-right-1" : "-left-1"
                          )} />
                        )}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              )}
            </Collapsible>
          );
        })}
      </nav>

      <div className={cn("pt-6 mt-6 border-t border-white/10 pb-8 relative z-10 px-6")}>
        <Link href="/" className="flex items-center justify-center gap-2 py-3 text-[10px] font-black text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 uppercase tracking-widest">
          <History className="w-3.5 h-3.5" />
          {!isCollapsed && <span>{t.production.backToSite}</span>}
        </Link>
      </div>
    </div>
  );
}
