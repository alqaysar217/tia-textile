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
  Users, 
  FileBarChart, 
  Settings, 
  Trash2 
} from 'lucide-react';

export const SYSTEM_MODULES = [
  { id: 'dashboard', labelAr: 'لوحة التحكم والإحصائيات', labelEn: 'Dashboard', icon: React.createElement(LayoutDashboard, { className: "w-3.5 h-3.5" }) },
  { id: 'orders', labelAr: 'أوامر الإنتاج (WIP)', labelEn: 'Production Orders', icon: React.createElement(Workflow, { className: "w-3.5 h-3.5" }) },
  { id: 'products', labelAr: 'كتالوج المنتجات', labelEn: 'Products Catalog', icon: React.createElement(ShoppingBag, { className: "w-3.5 h-3.5" }) },
  { id: 'materials', labelAr: 'المخزون والمواد الخام', labelEn: 'Inventory', icon: React.createElement(Layers, { className: "w-3.5 h-3.5" }) },
  { id: 'vouchers_issue', labelAr: 'سندات صرف المواد', labelEn: 'Material Issue', icon: React.createElement(FileInput, { className: "w-3.5 h-3.5" }) },
  { id: 'vouchers_receipt', labelAr: 'سندات استلام الإنتاج', labelEn: 'Production Receipts', icon: React.createElement(FileOutput, { className: "w-3.5 h-3.5" }) },
  { id: 'vouchers_return', labelAr: 'سندات المرتجع المخزني', labelEn: 'Material Returns', icon: React.createElement(RefreshCcw, { className: "w-3.5 h-3.5" }) },
  { id: 'wages', labelAr: 'صرف الأجور والمالية', labelEn: 'Wages', icon: React.createElement(HandCoins, { className: "w-3.5 h-3.5" }) },
  { id: 'overhead', labelAr: 'المصاريف التشغيلية', labelEn: 'Overhead Costs', icon: React.createElement(Receipt, { className: "w-3.5 h-3.5" }) },
  { id: 'workers', labelAr: 'إدارة العمال والأقسام', labelEn: 'Workforce', icon: React.createElement(Users, { className: "w-3.5 h-3.5" }) },
  { id: 'reports', labelAr: 'التقارير التحليلية', labelEn: 'Reports', icon: React.createElement(FileBarChart, { className: "w-3.5 h-3.5" }) },
  { id: 'settings', labelAr: 'إعدادات النظام', labelEn: 'Settings', icon: React.createElement(Settings, { className: "w-3.5 h-3.5" }) },
  { id: 'trash', labelAr: 'سلة المهملات والأرشفة', labelEn: 'Trash', icon: React.createElement(Trash2, { className: "w-3.5 h-3.5" }) },
];
