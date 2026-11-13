'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  ShoppingBag, 
  Layers, 
  FileInput, 
  FileOutput, 
  RefreshCcw, 
  HandCoins, 
  Receipt, 
  Users2, 
  FileBarChart, 
  Settings2, 
  Trash2,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  UserCheck,
  Calculator,
  PieChart,
  TrendingUp,
  UserPlus,
  MapPin
} from 'lucide-react';

/**
 * مصفوفة موديولات النظام الكاملة والمفصلة (22 موديولاً)
 * تم إضافة موديول الفروع لضمان تحكم دقيق في مواقع الجمعية.
 */
export const SYSTEM_MODULES = [
  { id: 'dashboard', labelAr: 'لوحة التحكم والإحصائيات', labelEn: 'Dashboard', icon: React.createElement(LayoutDashboard, { className: "w-3.5 h-3.5" }) },
  
  // شؤون الإنتاج
  { id: 'orders', labelAr: 'أوامر الإنتاج النشطة (WIP)', labelEn: 'Active Orders', icon: React.createElement(Workflow, { className: "w-3.5 h-3.5" }) },
  { id: 'orders_completed', labelAr: 'أرشيف الأوامر المكتملة', labelEn: 'Completed Orders', icon: React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }) },
  { id: 'products', labelAr: 'دليل المنتجات والكتالوج', labelEn: 'Products Catalog', icon: React.createElement(ShoppingBag, { className: "w-3.5 h-3.5" }) },
  
  // المخازن والمستودعات
  { id: 'materials', labelAr: 'سجل المواد الخام (خيوط/أصباغ)', labelEn: 'Raw Materials', icon: React.createElement(Layers, { className: "w-3.5 h-3.5" }) },
  { id: 'warehouse_finished', labelAr: 'مستودع المنجز الجاهز', labelEn: 'Finished Goods Wh', icon: React.createElement(PackageCheck, { className: "w-3.5 h-3.5" }) },
  
  // دورة السندات
  { id: 'vouchers_issue', labelAr: 'سندات صرف المواد', labelEn: 'Material Issue', icon: React.createElement(FileInput, { className: "w-3.5 h-3.5" }) },
  { id: 'vouchers_receipt', labelAr: 'سندات استلام الإنتاج', labelEn: 'Production Receipts', icon: React.createElement(FileOutput, { className: "w-3.5 h-3.5" }) },
  { id: 'vouchers_return', labelAr: 'سندات المرتجع المخزني', labelEn: 'Material Returns', icon: React.createElement(RefreshCcw, { className: "w-3.5 h-3.5" }) },
  
  // المالية والأجور
  { id: 'wages', labelAr: 'صرف الأجور والمدفوعات', labelEn: 'Wage Payments', icon: React.createElement(HandCoins, { className: "w-3.5 h-3.5" }) },
  { id: 'overhead', labelAr: 'المصاريف التشغيلية (Overhead)', labelEn: 'Overhead Costs', icon: React.createElement(Receipt, { className: "w-3.5 h-3.5" }) },
  
  // القوى العاملة
  { id: 'workers', labelAr: 'إدارة سجلات العمال', labelEn: 'Workers Registry', icon: React.createElement(Users2, { className: "w-3.5 h-3.5" }) },
  { id: 'departments', labelAr: 'إدارة الأقسام والمسارات', labelEn: 'Departments', icon: React.createElement(ShieldCheck, { className: "w-3.5 h-3.5" }) },
  
  // التقارير التحليلية
  { id: 'report_productivity', labelAr: 'تقرير إنتاجية وأجور العمال', labelEn: 'Productivity Report', icon: React.createElement(UserCheck, { className: "w-3.5 h-3.5" }) },
  { id: 'report_costs', labelAr: 'تقرير تحليل تكاليف الأوامر', labelEn: 'Order Cost Report', icon: React.createElement(Calculator, { className: "w-3.5 h-3.5" }) },
  { id: 'report_consumption', labelAr: 'تقرير استهلاك المواد الخام', labelEn: 'Consumption Report', icon: React.createElement(PieChart, { className: "w-3.5 h-3.5" }) },
  { id: 'report_financial', labelAr: 'تقرير الملخص المالي والنمو', labelEn: 'Financial Summary', icon: React.createElement(TrendingUp, { className: "w-3.5 h-3.5" }) },
  
  // الإدارة والرقابة
  { id: 'branches', labelAr: 'إدارة فروع الجمعية', labelEn: 'Branch Management', icon: React.createElement(MapPin, { className: "w-3.5 h-3.5" }) },
  { id: 'users', labelAr: 'إدارة المستخدمين والصلاحيات', labelEn: 'Users & Permissions', icon: React.createElement(UserPlus, { className: "w-3.5 h-3.5" }) },
  { id: 'settings', labelAr: 'إعدادات النظام العامة', labelEn: 'General Settings', icon: React.createElement(Settings2, { className: "w-3.5 h-3.5" }) },
  { id: 'trash', labelAr: 'سلة المهملات والأرشفة', labelEn: 'Smart Trash', icon: React.createElement(Trash2, { className: "w-3.5 h-3.5" }) },
  { id: 'ai', labelAr: 'المساعد الذكي (AI)', labelEn: 'AI Assistant', icon: React.createElement('span', { className: "font-black text-[10px]" }, 'AI') },
];
