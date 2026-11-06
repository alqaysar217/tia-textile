'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { 
  Box, 
  AlertCircle, 
  Construction, 
  ChevronLeft, 
  LayoutDashboard,
  Factory,
  Users,
  Package,
  Calculator,
  BarChart3,
  Settings,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ModulePlaceholderPage() {
  const pathname = usePathname();
  const params = useParams();
  
  // Clean up path names for display
  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[segments.length - 1] || 'Module';

  const moduleInfo: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
    'orders': { title: 'أوامر الإنتاج', desc: 'إدارة وجدولة أوامر التصنيع ومتابعة سير العمل.', icon: <Factory className="w-12 h-12" /> },
    'stages': { title: 'مراحل الإنتاج', desc: 'تحديد وإدارة خطوات التصنيع المتسلسلة للمنتجات.', icon: <Construction className="w-12 h-12" /> },
    'assignments': { title: 'توزيع العمل', desc: 'إسناد المهام والعمليات للعمال حسب التخصص.', icon: <Users className="w-12 h-12" /> },
    'monitoring': { title: 'متابعة الإنتاج', desc: 'رصد فوري لنسب الإنجاز في جميع خطوط الإنتاج.', icon: <BarChart3 className="w-12 h-12" /> },
    'materials': { title: 'المواد الخام', desc: 'إدارة أصناف ومخزون المواد الأولية ومستلزمات الإنتاج.', icon: <Box className="w-12 h-12" /> },
    'warehouses': { title: 'المستودعات', desc: 'تنظيم المستودعات وتوزيع الأصناف بين المخازن.', icon: <Package className="w-12 h-12" /> },
    'workers': { title: 'قائمة العمال', desc: 'إدارة ملفات العمال وتخصصاتهم وبياناتهم الأساسية.', icon: <Users className="w-12 h-12" /> },
    'costs': { title: 'تكاليف الإنتاج', desc: 'تحليل وتتبع تكاليف المواد والأجور والمصاريف الصناعية.', icon: <Calculator className="w-12 h-12" /> },
    'vouchers': { title: 'السندات', desc: 'الأرشيف المركزي لجميع السندات والوثائق المخزنية والمالية.', icon: <FileText className="w-12 h-12" /> },
    'settings': { title: 'الإعدادات', desc: 'تهيئة النظام وإدارة الخيارات العامة وصلاحيات الوصول.', icon: <Settings className="w-12 h-12" /> },
  };

  const info = moduleInfo[currentModule] || { 
    title: 'وحدة النظام', 
    desc: 'هذه الشاشة قيد التطوير ضمن المراحل القادمة لنظام إدارة الإنتاج.', 
    icon: <Construction className="w-12 h-12" /> 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in-95 duration-500">
      {/* Decorative Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150 animate-pulse" />
        <div className="w-24 h-24 bg-white border border-gray-100 rounded-3xl flex items-center justify-center text-primary shadow-xl relative z-10">
          {info.icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg animate-bounce">
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
          {segments.join(' / ')}
        </div>
        <h1 className="text-3xl font-black text-gray-900">{info.title}</h1>
        <p className="text-gray-500 font-medium leading-relaxed">
          {info.desc}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <Button variant="outline" className="h-12 px-8 rounded-2xl font-black gap-3 border-gray-200" asChild>
          <Link href="/production">
            <LayoutDashboard className="w-5 h-5" />
            لوحة التحكم
          </Link>
        </Button>
        <Button className="h-12 px-8 rounded-2xl font-black gap-3 shadow-lg shadow-primary/20">
          تفعيل الوحدة
        </Button>
      </div>

      {/* Development Indicator */}
      <div className="pt-20">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl max-w-sm text-right flex gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Construction className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">تحديثات المرحلة الأولى</p>
            <p className="text-[10px] text-amber-700 font-bold mt-1">
              تم إعداد الهيكل البصري لهذه الوحدة. سيتم تفعيل الوظائف البرمجية وربط البيانات في المراحل القادمة (Phase 2-11).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
