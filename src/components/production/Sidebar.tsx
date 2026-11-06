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
  ChevronRight,
  ShieldCheck,
  History,
  Layers,
  Truck,
  CreditCard,
  UserCheck,
  Warehouse,
  FileMinus,
  FilePlus,
  RefreshCw,
  AlertTriangle,
  ClipboardList
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
        { name: 'سندات صرف المواد', href: '/production/issue-vouchers' },
        { name: 'سندات إرجاع المواد', href: '/production/return-vouchers' },
        { name: 'حركة المخزون', href: '/production/inventory-moves' },
      ]
    },
    {
      name: 'العمال والأجور',
      icon: <Users className="w-5 h-5" />,
      children: [
        { name: 'قائمة العمال', href: '/production/workers' },
        { name: 'الأقسام والمشرفون', href: '/production/departments' },
        { name: 'استحقاقات الأجور', href: '/production/wage-entitlements' },
        { name: 'صرف الأجور', href: '/production/wage-payments' },
      ]
    },
    {
      name: 'السندات',
      icon: <FileText className="w-5 h-5" />,
      children: [
        { name: 'جميع السندات', href: '/production/vouchers' },
        { name: 'سندات استلام الإنتاج', href: '/production/receipt-vouchers' },
        { name: 'سندات التحويل', href: '/production/transfers' },
        { name: 'سندات الهالك والعيوب', href: '/production/defects' },
        { name: 'استلام المنتج النهائي', href: '/production/finished-goods' },
      ]
    },
    {
      name: 'التكاليف',
      icon: <Calculator className="w-5 h-5" />,
      children: [
        { name: 'تكاليف الإنتاج', href: '/production/costs' },
        { name: 'تكاليف الأقسام', href: '/production/dept-costs' },
        { name: 'تكلفة المنتجات', href: '/production/product-costs' },
      ]
    },
    {
      name: 'المنتجات',
      icon: <Package className="w-5 h-5" />,
      children: [
        { name: 'قائمة المنتجات', href: '/production/products' },
        { name: 'مواصفات المنتجات', href: '/production/specs' },
      ]
    },
    {
      name: 'التقارير',
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        { name: 'تقارير الإنتاج', href: '/production/reports/production' },
        { name: 'تقارير العمال', href: '/production/reports/workers' },
        { name: 'تقارير المخزون', href: '/production/reports/inventory' },
        { name: 'تقارير التكاليف', href: '/production/reports/costs' },
        { name: 'تقارير الأجور', href: '/production/reports/wages' },
      ]
    },
    {
      name: 'الإدارة',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: 'المستخدمون', href: '/production/users' },
        { name: 'الأدوار والصلاحيات', href: '/production/roles' },
        { name: 'سجل العمليات', href: '/production/audit' },
        { name: 'الإعدادات', href: '/production/settings' },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full py-6">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/10">
          <Factory className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tighter">نظام إدارة الإنتاج</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">الجمعية النسيجية</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((group) => (
          <Collapsible key={group.name} defaultOpen={true}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition-all group">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 group-hover:text-primary transition-colors">{group.icon}</span>
                <span className="text-sm font-black">{group.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1 pr-9">
              {group.children?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-lg text-[12px] font-bold transition-all",
                    pathname === item.href 
                      ? "bg-primary/5 text-primary border-r-2 border-primary" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="px-6 pt-6 border-t border-gray-100">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
              ع
            </div>
            <div>
              <p className="text-[10px] font-black">علي باحاج</p>
              <p className="text-[8px] text-gray-400 font-bold">مدير الإنتاج</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black text-primary hover:underline">
            <History className="w-3 h-3" />
            العودة للموقع العام
          </Link>
        </div>
      </div>
    </div>
  );
}
