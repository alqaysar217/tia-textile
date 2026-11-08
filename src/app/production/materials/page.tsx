'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  Gauge,
  Wallet,
  Package,
  Droplet,
  Scissors,
  Zap,
  BoxSelect,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  ArrowUp01,
  ArrowDown10
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MaterialsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'code' | 'nameAr' | 'currentQty' | 'price'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [deletingMatId, setDeletingMatId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    category: 'yarn',
    unit: 'kg',
    currentQty: 0,
    minQty: 0,
    price: 0,
    photoUrl: '',
    status: 'active'
  });

  const materialsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'materials');
  }, [db]);

  const { data: materials, loading } = useCollection<any>(materialsQuery);

  const categories = [
    { value: 'yarn', labelAr: 'الخيوط', labelEn: 'Yarn', icon: <Hash className="w-4 h-4" /> },
    { value: 'dye', labelAr: 'الأصباغ', labelEn: 'Dyes', icon: <Droplet className="w-4 h-4" /> },
    { value: 'prep', labelAr: 'التحضير والنسيج', labelEn: 'Prep & Weaving', icon: <Layers className="w-4 h-4" /> },
    { value: 'sewing', labelAr: 'الخياطة', labelEn: 'Sewing', icon: <Scissors className="w-4 h-4" /> },
    { value: 'finish', labelAr: 'التجهيز', labelEn: 'Processing', icon: <Zap className="w-4 h-4" /> },
    { value: 'packaging', labelAr: 'التغليف', labelEn: 'Packaging', icon: <Package className="w-4 h-4" /> },
    { value: 'other', labelAr: 'أخرى', labelEn: 'Other', icon: <BoxSelect className="w-4 h-4" /> },
  ];

  const units = [
    { value: 'kg', labelAr: 'كيلو (KG)', labelEn: 'Kilogram' },
    { value: 'yard', labelAr: 'ياردة (YD)', labelEn: 'Yard' },
    { value: 'roll', labelAr: 'رول (Roll)', labelEn: 'Roll' },
    { value: 'piece', labelAr: 'حبة (Pcs)', labelEn: 'Piece' },
    { value: 'spool', labelAr: 'بكرة (Spool)', labelEn: 'Spool' },
    { value: 'wheel', labelAr: 'عجلة (Wheel)', labelEn: 'Wheel' },
    { value: 'liter', labelAr: 'لتر (L)', labelEn: 'Liter' },
    { value: 'meter', labelAr: 'متر (M)', labelEn: 'Meter' },
    { value: 'set', labelAr: 'طقم (Set)', labelEn: 'Set' },
    { value: 'box', labelAr: 'صندوق (Box)', labelEn: 'Box' },
    { value: 'carton', labelAr: 'كرتون (Ctn)', labelEn: 'Carton' },
    { value: 'gram', labelAr: 'جرام (G)', labelEn: 'Gram' },
  ];

  const filtered = useMemo(() => {
    let rawData = (materials || []).filter(m => m.status !== 'deleted');

    // 1. Search Filter
    if (search) {
      rawData = rawData.filter(m => 
        m.nameAr?.includes(search) || 
        m.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
        m.code?.includes(search)
      );
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      rawData = rawData.filter(m => m.category === categoryFilter);
    }

    // 3. Status Filter (Available vs Low Stock)
    if (statusFilter !== 'all') {
      rawData = rawData.filter(m => {
        const isLow = (m.currentQty || 0) <= (m.minQty || 0);
        return statusFilter === 'low' ? isLow : !isLow;
      });
    }

    // 4. Advanced Sorting
    return rawData.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'currentQty' || sortBy === 'price') {
        const numA = Number(valA);
        const numB = Number(valB);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const comparison = String(valA).localeCompare(String(valB), 'en', { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [materials, search, categoryFilter, statusFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingMatId(null);
    setIsSubmitting(false);
    setIsCompressing(false);
    setFormData({ 
      code: '', 
      nameAr: '', 
      nameEn: '', 
      category: 'yarn', 
      unit: 'kg', 
      currentQty: 0, 
      minQty: 0, 
      price: 0,
      photoUrl: '',
      status: 'active' 
    });
  }, []);

  const toggleSort = (key: 'code' | 'nameAr' | 'currentQty' | 'price') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
        setIsCompressing(false);
      };
    };
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    setIsSubmitting(true);
    const generatedCode = editingMatId ? formData.code : `MAT-${Math.floor(1000 + Math.random() * 9000)}`;

    const materialData = {
      ...formData,
      code: generatedCode,
      currentQty: Number(formData.currentQty),
      minQty: Number(formData.minQty),
      price: Number(formData.price),
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
        toast({ title: lang === 'ar' ? "تم تحديث الصنف" : "Item Updated" });
      } else {
        const colRef = collection(db, 'materials');
        const newDoc = { ...materialData, createdAt: serverTimestamp() };
        addDoc(colRef, newDoc).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'materials', operation: 'create', requestResourceData: newDoc }));
        });
        toast({ title: lang === 'ar' ? "تمت إضافة الصنف" : "Item Added" });
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
      currentQty: mat.currentQty || 0,
      minQty: mat.minQty || 0,
      price: mat.price || 0,
      photoUrl: mat.photoUrl || '',
      status: mat.status || 'active'
    });
    setIsAddDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Name (AR)',
      'Name (EN)',
      'Category',
      'Unit',
      'Qty',
      'Min Level',
      'Price'
    ];

    const escapeCSV = (val: any) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map(m => {
      const cat = categories.find(c => c.value === m.category);
      return [
        escapeCSV(m.code),
        escapeCSV(m.nameAr),
        escapeCSV(m.nameEn),
        cat ? escapeCSV(lang === 'ar' ? cat.labelAr : cat.labelEn) : escapeCSV(m.category),
        escapeCSV(m.unit),
        m.currentQty || 0,
        m.minQty || 0,
        m.price || 0
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `materials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: lang === 'ar' ? "تم تحميل ملف CSV" : "CSV Downloaded" });
  };

  const getCategoryIcon = (catValue: string) => {
    const cat = categories.find(c => c.value === catValue);
    return cat?.icon || <Box className="w-4 h-4" />;
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
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المواد' : 'Items'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{(filtered.length).toLocaleString('en-US')}</p>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'نقص مخزون' : 'Low Stock'}</p>
                <p className="text-sm font-black text-rose-600 tabular-nums">{(filtered.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length).toLocaleString('en-US')}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة مادة' : 'Add Material'}
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
            <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
                  <Filter className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تصفية' : 'Filter'}
                  {(categoryFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'code' || sortOrder !== 'asc') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-lg border-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('code')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                  <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'الكود' : 'SKU'}</div>
                  {sortBy === 'code' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('nameAr')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                  <div className="flex items-center gap-2"><Languages className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'الاسم' : 'Name'}</div>
                  {sortBy === 'nameAr' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('currentQty')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                  <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'الكمية' : 'Quantity'}</div>
                  {sortBy === 'currentQty' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('price')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                  <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'السعر' : 'Price'}</div>
                  {sortBy === 'price' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'عرض الحالة' : 'STATUS'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'الكل' : 'All Items'}
                  {statusFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('available')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'متوفر' : 'Available Only'}
                  {statusFilter === 'available' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('low')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'مخزون منخفض' : 'Low Stock Only'}
                  {statusFilter === 'low' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'حسب الفئة' : 'CATEGORY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                  {lang === 'ar' ? 'الكل' : 'All Categories'}
                  {categoryFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                {categories.map(c => (
                  <DropdownMenuItem key={c.value} onClick={() => setCategoryFilter(c.value)} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                    {lang === 'ar' ? c.labelAr : c.labelEn}
                    {categoryFilter === c.value && <Check className="w-3 h-3 text-emerald-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">
                    <button onClick={() => toggleSort('code')} className="flex items-center gap-2 hover:text-emerald-700 transition-colors uppercase">
                      {lang === 'ar' ? 'المادة' : 'ITEM'}
                      {sortBy === 'code' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'الفئة' : 'CATEGORY'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">
                    <button onClick={() => toggleSort('currentQty')} className="flex items-center gap-2 mx-auto hover:text-emerald-700 transition-colors uppercase">
                      {lang === 'ar' ? 'المخزون' : 'ON HAND'}
                      {sortBy === 'currentQty' ? (sortOrder === 'asc' ? <ArrowUp01 className="w-3 h-3" /> : <ArrowDown10 className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">
                    <button onClick={() => toggleSort('price')} className="flex items-center gap-2 mx-auto hover:text-emerald-700 transition-colors uppercase">
                      {lang === 'ar' ? 'السعر' : 'PRICE'}
                      {sortBy === 'price' ? (sortOrder === 'asc' ? <ArrowUp01 className="w-3 h-3" /> : <ArrowDown10 className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{lang === 'ar' ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب دليل المواد...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد مواد مسجلة حالياً</TableCell></TableRow>
                ) : filtered.map((mat) => {
                  const cat = categories.find(c => c.value === mat.category);
                  const isLow = (mat.currentQty || 0) <= (mat.minQty || 0);
                  return (
                    <TableRow key={mat.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50">
                            <AvatarImage src={mat.photoUrl || undefined} className="object-cover" />
                            <AvatarFallback className="bg-emerald-50 text-emerald-600">
                              {getCategoryIcon(mat.category)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">{lang === 'ar' ? mat.nameAr : mat.nameEn}</span>
                            <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-wider uppercase">{mat.code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                          {cat ? (lang === 'ar' ? cat.labelAr : cat.labelEn) : mat.category}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn("text-xs font-black tabular-nums", isLow ? "text-rose-600" : "text-slate-900")}>
                            {(mat.currentQty || 0).toLocaleString('en-US')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{mat.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 tabular-nums">
                          <Wallet className="w-3 h-3 opacity-30" />
                          {(mat.price || 0).toLocaleString('en-US')}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          isLow ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          <div className={cn("w-1 h-1 rounded-full", isLow ? "bg-rose-600" : "bg-emerald-600")} />
                          {isLow ? (lang === 'ar' ? 'مخزون منخفض' : 'Low Stock') : (lang === 'ar' ? 'جيد' : 'Available')}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 shadow-xl min-w-[180px]">
                            <DropdownMenuItem onClick={() => handleEditClick(mat)} className="gap-3 font-bold text-xs py-2.5">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل البيانات' : 'Update Record'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeletingMatId(mat.id)} className="gap-3 font-bold text-xs text-red-600 py-2.5">
                              <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive'}
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
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[550px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-300" />
                {editingMatId ? (lang === 'ar' ? 'تعديل صنف' : 'Update Item') : (lang === 'ar' ? 'تعريف مادة خام جديدة' : 'New Raw Material')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Definition of production assets & inventory items</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveMaterial} className="p-6 space-y-4 bg-white">
            <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100">
              <div 
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                <Avatar className="h-20 w-20 rounded-2xl border-4 border-slate-100 shadow-md bg-slate-50 overflow-hidden">
                  <AvatarImage src={formData.photoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-50 text-slate-300">
                    {isCompressing ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <ImageIcon className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Label className="text-[10px] font-black uppercase text-slate-400">صورة المادة (اختياري)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Hash className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'كود المادة (تلقائي)' : 'AUTO SKU'}
                </Label>
                <Input value={editingMatId ? formData.code : 'AUTO-GENERATE'} disabled className="h-10 font-bold text-xs bg-slate-100 text-slate-500 tabular-nums" />
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
                {lang === 'ar' ? 'اسم المادة (عربي)' : 'ARABIC NAME'}
              </Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Scale className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'وحدة القياس' : 'UNIT'}
                </Label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                  {units.map(u => <option key={u.value} value={u.value}>{lang === 'ar' ? u.labelAr : u.labelEn}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'سعر الوحدة' : 'UNIT PRICE'}
                </Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Box className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'الكمية الحالية' : 'OPENING QTY'}
                </Label>
                <Input type="number" value={formData.currentQty} onChange={(e) => setFormData({...formData, currentQty: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Gauge className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'حد الأمان' : 'MIN LEVEL'}
                </Label>
                <Input type="number" value={formData.minQty} onChange={(e) => setFormData({...formData, minQty: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" />
                <p className="text-[8px] text-slate-400 font-bold italic">
                  {lang === 'ar' ? '* أقل كمية مسموح بها قبل إطلاق تنبيه نقص المخزون.' : '* Minimum qty before low stock alert.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Commit Record'}
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
