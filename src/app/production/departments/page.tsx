'use client';

import React, { useState } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  Filter,
  ChevronRight,
  ArrowLeftRight,
  Info,
  Save,
  Activity,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from '@/hooks/use-toast';

export default function DepartmentsPage() {
  const { lang } = useTranslation();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form State for "Work correctly" requirement
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    descAr: ''
  });

  const [departments, setDepartments] = useState([
    { id: '1', nameAr: 'قسم الخياطة', nameEn: 'Sewing Department', descAr: 'خياطة المعاوز وتجهيز الأطراف', workers: 25, active: true, code: 'DEPT-SEW' },
    { id: '2', nameAr: 'قسم التطريز', nameEn: 'Embroidery Department', descAr: 'إضافة النقوش الملكية واليدوية', workers: 15, active: true, code: 'DEPT-EMB' },
    { id: '3', nameAr: 'قسم الصباغة', nameEn: 'Dyeing Department', descAr: 'تلوين الخيوط ومعالجة الألوان', workers: 8, active: true, code: 'DEPT-DYE' },
    { id: '4', nameAr: 'قسم الفحص والجودة', nameEn: 'Quality Control', descAr: 'المراجعة النهائية قبل التغليف', workers: 5, active: true, code: 'DEPT-QC' },
    { id: '5', nameAr: 'قسم الغسيل والكي', nameEn: 'Washing & Ironing', descAr: 'تجهيز المنتج النهائي', workers: 10, active: false, code: 'DEPT-FIN' },
  ]);

  const filtered = departments.filter(d => 
    d.nameAr.includes(search) || d.nameEn.toLowerCase().includes(search.toLowerCase()) || d.code.includes(search)
  );

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDept = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      workers: 0,
      active: true
    };

    setDepartments([...departments, newDept]);
    setIsAddDialogOpen(false);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '' });
    
    toast({
      title: lang === 'ar' ? "تم الإضافة بنجاح" : "Department Added",
      description: lang === 'ar' ? `تم تسجيل ${formData.nameAr} في النظام.` : `Registered ${formData.nameEn} successfully.`,
    });
  };

  const activeCount = departments.filter(d => d.active).length;
  const totalWorkers = departments.reduce((acc, curr) => acc + curr.workers, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-12">
      {/* System Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
        <span>{lang === 'ar' ? 'نظام الإنتاج' : 'Production'}</span>
        <ChevronRight className="w-3 h-3 rotate-180 rtl:rotate-0" />
        <span className="text-primary">{lang === 'ar' ? 'إدارة الأقسام' : 'Departments'}</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            {lang === 'ar' ? 'أقسام ومراحل الإنتاج' : 'Production Departments'}
          </h1>
          <p className="text-sm text-gray-400 font-medium ps-4">
            {lang === 'ar' ? 'تعريف مراكز التكلفة ومراحل سير العمل التقنية' : 'Define cost centers and technical workflow stages'}
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/95 text-white gap-3 rounded-xl shadow-xl shadow-primary/10 font-black transition-all active:scale-95">
              <Plus className="w-5 h-5" />
              {lang === 'ar' ? 'إضافة قسم جديد' : 'New Department'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-gray-100 shadow-2xl overflow-hidden p-0">
            <div className="bg-primary p-6 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Factory className="w-24 h-24" /></div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">{lang === 'ar' ? 'إضافة قسم جديد' : 'New Department'}</DialogTitle>
                <DialogDescription className="text-white/70 font-bold mt-1">
                  {lang === 'ar' ? 'قم بإدخال بيانات القسم الأساسية لتعريفه في النظام' : 'Enter department details to register in system'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ar' ? 'كود القسم' : 'Dept Code'}</Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="DEPT-XXX" 
                    className="h-11 rounded-lg border-gray-200 font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ar' ? 'الحالة' : 'Status'}</Label>
                  <div className="flex items-center h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {lang === 'ar' ? 'نشط تلقائياً' : 'Active'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ar' ? 'اسم القسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input 
                  value={formData.nameAr}
                  onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                  placeholder={lang === 'ar' ? 'أدخل اسم القسم' : 'Enter name'} 
                  className="h-11 rounded-lg border-gray-200 font-bold" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</Label>
                <Input 
                  value={formData.nameEn}
                  onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                  placeholder="Department Name" 
                  className="h-11 rounded-lg border-gray-200 font-bold" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lang === 'ar' ? 'الوصف الوظيفي' : 'Process Description'}</Label>
                <Textarea 
                  value={formData.descAr}
                  onChange={(e) => setFormData({...formData, descAr: e.target.value})}
                  placeholder={lang === 'ar' ? 'شرح مختصر لعمل القسم...' : 'Short description...'} 
                  className="rounded-lg border-gray-200 resize-none h-24 font-medium" 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="submit" className="flex-1 h-12 bg-primary rounded-xl font-black gap-2">
                  <Save className="w-4 h-4" />
                  {lang === 'ar' ? 'حفظ القسم' : 'Save Dept'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 px-6 rounded-xl font-black">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modern Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm group hover:border-primary/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'الأقسام النشطة' : 'Active Units'}</p>
              <h3 className="text-2xl font-black tabular-nums">{activeCount} / {departments.length}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm group hover:border-secondary/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary border border-secondary/10"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي الحرفيين' : 'Total Artisans'}</p>
              <h3 className="text-2xl font-black tabular-nums">{totalWorkers}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-primary text-white border-none rounded-xl p-6 shadow-xl transition-all">
          <div className="absolute inset-0 opacity-10 textile-pattern" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{lang === 'ar' ? 'حالة النظام' : 'System Health'}</p>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'مستقر تشغيلياً' : 'Stable'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث سريع عن الأقسام...' : 'Quick search...'}
              className="pr-11 h-11 bg-gray-50/50 border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-primary/10"
            />
          </div>
          <Button variant="ghost" className="h-11 px-4 rounded-lg font-black gap-2 border border-dashed border-gray-200 text-gray-500 hover:text-primary hover:bg-primary/5">
            <Filter className="w-4 h-4" />
            {lang === 'ar' ? 'تصفية متقدمة' : 'Advanced Filter'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'تم العثور على:' : 'Found:'}</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black tabular-nums">{filtered.length}</span>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
        <Table className="text-right">
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200/60">
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'المعرف الرقمي' : 'UID'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'اسم القسم' : 'Dept Name'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'وصف المسار' : 'Process'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'القوى العاملة' : 'Workforce'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'الحالة التشغيلية' : 'Status'}</TableHead>
              <TableHead className="h-14 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((dept) => (
              <TableRow key={dept.id} className="group hover:bg-gray-50/30 transition-all border-b border-gray-100/60">
                <TableCell className="px-6 py-5 font-black text-primary/60 text-[10px] tabular-nums tracking-widest">
                  {dept.code}
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900 group-hover:text-primary transition-colors">{lang === 'ar' ? dept.nameAr : dept.nameEn}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{lang === 'ar' ? dept.nameEn : dept.nameAr}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 text-gray-500 max-w-[280px] truncate text-[11px] font-bold">
                  {lang === 'ar' ? dept.descAr : 'No process defined'}
                </TableCell>
                <TableCell className="px-6 py-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-7 bg-gray-100 rounded-md text-[11px] font-black tabular-nums border border-gray-200/50">
                    {dept.workers}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    dept.active 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full me-2 ${dept.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {dept.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Inactive')}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-xl min-w-[180px] p-1">
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer rounded-lg">
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Unit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer rounded-lg">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" /> {lang === 'ar' ? 'إعادة توزيع العمال' : 'Redistribute'}
                      </DropdownMenuItem>
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer text-rose-600 focus:text-rose-700 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'أرشفة القسم' : 'Archive Dept'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer System Info */}
      <div className="bg-muted/30 border border-border/50 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{lang === 'ar' ? 'إرشادات مراكز التكلفة' : 'Cost Center Guidelines'}</p>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-4xl">
            {lang === 'ar' 
              ? 'تُعرف الأقسام في النظام ككيانات مالية وتشغيلية مستقلة. يتم توزيع الأجور والتكاليف الصناعية بناءً على مخرجات كل قسم. يرجى التأكد من كود القسم قبل ربطه بأي أمر إنتاج جديد لتجنب تداخل التكاليف.' 
              : 'Departments are defined as independent financial and operational entities. Wages and industrial costs are allocated based on outputs. Verify dept code before linking to any PO to avoid cost overlap.'}
          </p>
        </div>
      </div>
    </div>
  );
}