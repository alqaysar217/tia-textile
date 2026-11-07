
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
  History,
  Trash2,
  ChevronLeft,
  ChevronRight
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
  children?: { name: string; href: string }[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { lang, t, dir } = useTranslation();
  const { open, state } = useSidebar();

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
        { name: t.production.orders, href: '/production/orders' },
        { name: t.production.stages, href: '/production/stages' },
        { name: t.production.assignments, href: '/production/assignments' },
        { name: t.production.monitoring, href: '/production/monitoring' },
        { name: t.production.wip, href: '/production/wip' },
      ]
    },
    {
      name: t.production.materials,
      icon: <Box className="w-5 h-5" />,
      children: [
        { name: t.production.rawMaterials, href: '/production/materials' },
        { name: t.production.warehouses, href: '/production/warehouses' },
        { name: t.production.issueVouchers, href: '/production/issue-vouchers' },
        { name: t.production.inventoryMoves, href: '/production/inventory-moves' },
      ]
    },
    {
      name: t.production.workersAndWages,
      icon: <Users className="w-5 h-5" />,
      children: [
        { name: t.production.workersList, href: '/production/workers' },
        { name: t.production.departments, href: '/production/departments' },
        { name: t.production.wageEntitlements, href: '/production/wage-entitlements' },
      ]
    },
    {
      name: t.production.vouchers,
      icon: <FileText className="w-5 h-5" />,
      children: [
        { name: t.production.allVouchers, href: '/production/vouchers' },
        { name: t.production.receiptVouchers, href: '/production/receipt-vouchers' },
        { name: t.production.transfers, href: '/production/transfers' },
      ]
    },
    {
      name: t.production.reports,
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        { name: t.production.productionReports, href: '/production/reports/production' },
        { name: t.production.costReports, href: '/production/reports/costs' },
      ]
    },
    {
      name: t.production.management,
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: t.production.roles, href: '/production/roles' },
        { name: t.production.settings, href: '/production/settings' },
        { name: t.production.trash, href: '/production/trash' },
      ]
    },
  ];

  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn(
      "flex flex-col h-full bg-primary text-white/80 transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Section */}
      <div className={cn("mb-10 pt-8", isCollapsed ? "px-4" : "px-8")}>
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden p-1 shadow-xl">
            <img 
              src="/images/logo.png" 
              alt="Association Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-sm font-black text-white leading-tight uppercase tracking-tight">{t.production.systemTitle}</h2>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">{t.production.cooperative}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto overflow-x-hidden">
        {navigation.map((group) => (
          <Collapsible key={group.name} defaultOpen={!isCollapsed && (group.name === t.production.dashboard || group.name === t.production.production || group.name === t.production.management)}>
            <CollapsibleTrigger disabled={isCollapsed} className={cn(
              "flex items-center justify-between w-full p-3 rounded-xl hover:bg-white/5 hover:text-white transition-all group",
              isCollapsed && "justify-center"
            )}>
              <div className="flex items-center gap-3">
                <span className="text-white/40 group-hover:text-white transition-colors">{group.icon}</span>
                {!isCollapsed && <span className="text-xs font-black animate-in fade-in duration-500">{group.name}</span>}
              </div>
              {!isCollapsed && <ChevronDown className="w-3 h-3 text-white/30 transition-transform duration-200" />}
            </CollapsibleTrigger>
            {!isCollapsed && (
              <CollapsibleContent className="space-y-1 mt-1 pr-10 rtl:pr-10 ltr:pl-10">
                {group.children?.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center p-2 rounded-lg text-[11px] font-bold transition-all relative",
                      pathname === item.href 
                        ? "text-white bg-white/10" 
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {pathname === item.href && (
                      <span className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-secondary rounded-full",
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

      {/* Footer Info Area */}
      <div className={cn("pt-6 mt-6 border-t border-white/5 pb-8", isCollapsed ? "px-4" : "px-6")}>
        <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 space-y-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary text-xs font-black border border-secondary/20">
                {lang === 'ar' ? 'ع' : 'A'}
              </div>
              <div>
                <p className="text-xs font-black text-white">{lang === 'ar' ? 'علي باحاج' : 'Ali Bahaj'}</p>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{lang === 'ar' ? 'مدير الإنتاج' : 'Manager'}</p>
              </div>
            </div>
          )}
          <Link href="/" className={cn(
            "flex items-center justify-center gap-2 py-2 text-[10px] font-black text-white/60 hover:text-white bg-white/5 rounded-xl transition-all",
            isCollapsed && "p-2"
          )}>
            <History className="w-3 h-3" />
            {!isCollapsed && <span className="animate-in fade-in duration-500">{t.production.backToSite}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}
