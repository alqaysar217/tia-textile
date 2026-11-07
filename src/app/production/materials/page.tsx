
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  Filter, 
  ChevronRight, 
  Save, 
  Box, 
  Package, 
  History, 
  Info, 
  Hash,
  Languages,
  Type,
  Activity,
  AlertCircle,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Check,
  FileDown,
  Layers,
  Scale,
  Gauge
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function MaterialsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'nameAr' | 'minQty'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [deletingMatId, setDeletingMatId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    category: 'yarn',
    unit: 'kg',
    minQty: 0,
    status: 'active'
  });

  const materialsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'materials');
  }, [db]);

  const { data: materials, loading } = useCollection<any>(materialsQuery);

  const categories = [
    { value: 'yarn', labelAr: 'خيوط وغزل', labelEn: 'Yarn & Threads' },
    { value: 'dye', labelAr: 'أصباغ وألوان', labelEn: 'Dyes & Colors' },
    { value: 'packaging', labelAr: 'مواد تغليف', labelEn: 'Packaging' },
    { value: 'auxiliary', labelAr: 'مستلزمات إنتاج', labelEn: 'Auxiliary' },
    { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
  ];

  const filtered = useMemo(() => {
    let rawData = (materials || []).filter(m => m.status !== 'deleted');

    if (search) {
      rawData = rawData.filter(m => 
        m.nameAr?.includes(search) || 
        m.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
        m.code?.includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      rawData = rawData.filter(m => m.category === categoryFilter);
    }

    return rawData.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'minQty') {
        return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }

      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [materials, search, categoryFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingMatId(null);
    setIsSubmitting(false);
    setCodeError(null);
    setFormData({ code: '', nameAr: '', nameEn: '', category: 'yarn', unit: 'kg', minQty: 0, status: 'active' });
  }, []);

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    const isDuplicate = materials?.some(m => 
      m.code?.toLowerCase() === formData.code.toLowerCase() && 
      m.id !== editingMatId && 
      m.status !== 'deleted'
    );

    if (isDuplicate) {
      setCodeError(lang === 'ar' ? `هذا الكود مستخدم بالفعل` : `Code already exists`);
      return;
    }

    setIsSubmitting(true);
    const materialData = {
      ...formData,
      code: formData.code.toUpperCase(),
      minQty: Number(formData.minQty),
      updatedAt: serverTimestamp(),
    };

    const currentId = editingMatId;

    resetForm();

    setTimeout(() => {
      if (currentId) {
        const docRef = doc(db, 'materials', currentId);
        updateDoc(docRef, materialData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'materials', operation: 'update', requestResourceData: materialData }));
        });
        toast({ title: lang === 'ar' ? "تم التحديث" : "Updated" });
      } else {
        const colRef = collection(db, 'materials');
        const newDoc = { ...materialData, createdAt: serverTimestamp() };
        addDoc(colRef, newDoc).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'materials', operation: 'create', requestResourceData: newDoc }));
        });
        toast({ title: lang === 'ar' ? "تمت الإضافة" : "Added" });
      }
    }, 0);
  };

  const handleArchiveMaterial = () => {
    if (!db || !deletingMatId) return;
    const targetId = deletingMatId;
    setDeletingMatId(null);
    updateDoc(doc(db, 'materials', targetId), { status: 'deleted', deletedAt: serverTimestamp() });
    toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
  };

  const handleEditClick = (mat: any) => {
    setEditingMatId(mat.id);
    setFormData({
      code: mat.code || '',
      nameAr: mat.nameAr || '',
      nameEn: mat.nameEn || '',
      category: mat.category || 'yarn',
      unit: mat.unit || 'kg',
      minQty: mat.minQty || 0,
      status: mat.status || 'active'
    });
    setIsAddDialogOpen(true);
  };

  const handleExportExcel = () => {
    const headers = [
      lang === 'ar' ? 'كود المادة' : 'SKU',
      lang === 'ar' ? 'الاسم' : 'Name',
      lang === 'ar' ? 'الفئة' : 'Category',
      lang === 'ar' ? 'الوحدة' : 'Unit',
      lang === 'ar' ? 'حد الأمان' : 'Min Qty'
    ];

    const rows = filtered.map(m => {
      const cat = categories.find(c => c.value === m.category);
      return [
        m.code,
        lang === 'ar' ? m.nameAr : m.nameEn,
        cat ? (lang === 'ar' ? cat.labelAr : cat.labelEn) : m.category,
        m.unit,
        m.minQty
      ];
    });

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><style>table { border-collapse: collapse; direction: rtl; } th { background: #065F46; color: #fff; padding: 10px; } td { border: 1px solid #eee; padding: 8px; }</style></head>
      <body><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    toast({ title: lang === 'ar' ? "بدء التحميل" : "Downloading" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المخازن' : 'WMS'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'سجل المواد' : 'Items Catalog'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'دليل المواد الخام والمستلزمات' : 'Raw Materials Master Data'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المواد' : 'Total Items'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{loading ? '..' : filtered.length}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
            </Button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالكود أو اسم المادة...' : 'Quick catalog search...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200 text-xs font-bold`}
            />
          </div>
          
          <div className="flex items-center gap-1.5 px-1.5">
            <Button onClick={handleExportExcel} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ar' ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
                  <Filter className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تصفية' : 'Filter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'حسب الفئة' : 'BY CATEGORY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="flex items-center justify-between text-xs font-bold">
                  {lang === 'ar' ? 'الكل' : 'All Categories'}
                  {categoryFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                {categories.map(c => (
                  <DropdownMenuItem key={c.value} onClick={() => setCategoryFilter(c.value)} className="flex items-center justify-between text-xs font-bold">
                    {lang === 'ar' ? c.labelAr : c.labelEn}
                    {categoryFilter === c.value && <Check className="w-3 h-3 text-emerald-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {lang === 'ar' ? 'دليل الأصناف نشط' : 'Catalog Active'}
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className="text-right">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'كود المادة (SKU)' : 'SKU'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'الاسم' : 'NAME'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'الفئة' : 'CATEGORY'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{lang === 'ar' ? 'الوحدة' : 'UNIT'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{lang === 'ar' ? 'حد الأمان' : 'SAFETY STOCK'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري جلب دليل الأصناف...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد مواد مسجلة</TableCell></TableRow>
                ) : filtered.map((mat) => {
                  const cat = categories.find(c => c.value === mat.category);
                  return (
                    <TableRow key={mat.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="px-6 py-3 font-bold text-emerald-700 text-[11px] tabular-nums tracking-wider">{mat.code}</TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs">{lang === 'ar' ? mat.nameAr : mat.nameEn}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ar' ? mat.nameEn : mat.nameAr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black">
                          {cat ? (lang === 'ar' ? cat.labelAr : cat.labelEn) : mat.category}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-slate-500">
                          <Scale className="w-3 h-3 opacity-30" />
                          {mat.unit}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-black tabular-nums">
                          <Gauge className="w-3 h-3" />
                          {mat.minQty}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 shadow-xl min-w-[180px]">
                            <DropdownMenuItem onClick={() => handleEditClick(mat)} className="gap-3 font-bold text-xs py-2.5">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل الصنف' : 'Edit Item'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeletingMatId(mat.id)} className="gap-3 font-bold text-xs text-red-600 py-2.5">
                              <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'أرشفة المادة' : 'Archive'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* SYSTEM FOOTER */}
        <div className="mt-4 flex-none bg-slate-900 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Inventory Master Protocol</p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80">
              {lang === 'ar' ? 'تعريف المواد الخام بشكل دقيق هو الخطوة الأولى لحساب تكاليف الإنتاج بشكل صحيح.' : 'Precise material definition is the first step for accurate production costing.'}
            </p>
          </div>
        </div>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-300" />
                {editingMatId ? (lang === 'ar' ? 'تعديل صنف' : 'Update Item') : (lang === 'ar' ? 'تسجيل صنف جديد' : 'New Material')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Definition of production supplies</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveMaterial} className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Hash className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'كود المادة (SKU)' : 'ITEM SKU'}
                </Label>
                <Input 
                  value={formData.code} 
                  onChange={(e) => {setFormData({...formData, code: e.target.value}); setCodeError(null);}} 
                  placeholder="MAT-001" 
                  className={cn("h-10 font-bold text-xs bg-slate-50", codeError && "border-red-500")} 
                  required 
                />
                {codeError && <p className="text-[9px] font-black text-red-600 mt-1">{codeError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'الفئة' : 'CATEGORY'}
                </Label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500">
                  {categories.map(c => <option key={c.value} value={c.value}>{lang === 'ar' ? c.labelAr : c.labelEn}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Languages className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'الاسم بالعربي' : 'ARABIC NAME'}
              </Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Type className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'الاسم بالإنجليزي' : 'ENGLISH NAME'}
              </Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({...formData, nameEn: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Scale className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'وحدة القياس' : 'UNIT'}
                </Label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                  <option value="kg">{lang === 'ar' ? 'كيلو (KG)' : 'Kilogram'}</option>
                  <option value="yard">{lang === 'ar' ? 'ياردة (YD)' : 'Yard'}</option>
                  <option value="roll">{lang === 'ar' ? 'رول (Roll)' : 'Roll'}</option>
                  <option value="piece">{lang === 'ar' ? 'حبة (Pcs)' : 'Piece'}</option>
                  <option value="liter">{lang === 'ar' ? 'لتر (L)' : 'Liter'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Gauge className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'حد الأمان' : 'SAFETY STOCK'}
                </Label>
                <Input type="number" value={formData.minQty} onChange={(e) => setFormData({...formData, minQty: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md">
                <Save className="w-4 h-4 me-2" />
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Save Record'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 rounded-md">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!deletingMatId} onOpenChange={(open) => !open && setDeletingMatId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة الصنف' : 'Archive Item'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' ? 'سيتم نقل هذه المادة للأرشيف. يمكنك استعادتها من سلة المهملات.' : 'Item will be moved to smart trash.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveMaterial} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingMatId(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
