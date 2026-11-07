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
  ShoppingBag, 
  History, 
  Info, 
  Hash,
  Languages,
  Activity,
  AlertCircle,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Check,
  FileDown,
  Tag,
  Wallet,
  LayoutGrid,
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

export default function ProductsManagementPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'sku' | 'nameAr' | 'price'>('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [deletingProdId, setDeletingProdId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [formData, setFormData] = useState({
    sku: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    category: 'ملكي',
    price: 0,
    status: 'available',
    image: '',
  });

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: products, loading } = useCollection<any>(productsQuery);

  const categories = [
    "ملكي", "حليسي", "بيضاني", "حديدي", "شحري", "سلاطيني", 
    "اللحجي", "الحضرمي", "الوصابي", "التهامي", "العدني", 
    "الصنعاني", "السادة", "الشموخ", "أخرى"
  ];

  const statuses = [
    { value: 'available', labelAr: 'متوفر', labelEn: 'Available' },
    { value: 'out_of_stock', labelAr: 'نفذت', labelEn: 'Out of Stock' },
    { value: 'limited', labelAr: 'محدود', labelEn: 'Limited' },
    { value: 'soon', labelAr: 'قريباً', labelEn: 'Soon' },
  ];

  const filtered = useMemo(() => {
    let rawData = (products || []).filter(p => p.status !== 'deleted');

    if (search) {
      rawData = rawData.filter(p => 
        p.nameAr?.includes(search) || 
        p.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
        p.sku?.includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      rawData = rawData.filter(p => p.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      rawData = rawData.filter(p => p.status === statusFilter);
    }

    return rawData.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'price') {
        const numA = Number(valA);
        const numB = Number(valB);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const comparison = String(valA).localeCompare(String(valB), 'en', { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, search, categoryFilter, statusFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingProdId(null);
    setIsSubmitting(false);
    setIsCompressing(false);
    setFormData({ 
      sku: '', 
      nameAr: '', 
      nameEn: '', 
      descriptionAr: '',
      descriptionEn: '',
      category: 'ملكي', 
      price: 0, 
      status: 'available',
      image: '' 
    });
  }, []);

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
        const MAX_SIZE = 400;
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
        setFormData(prev => ({ ...prev, image: compressedBase64 }));
        setIsCompressing(false);
      };
    };
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    setIsSubmitting(true);
    const generatedSku = editingProdId ? formData.sku : `PROD-${Math.floor(1000 + Math.random() * 9000)}`;

    const productData = {
      ...formData,
      sku: generatedSku,
      price: Number(formData.price),
      updatedAt: serverTimestamp(),
    };

    const currentId = editingProdId;
    resetForm();

    setTimeout(() => {
      if (currentId) {
        const docRef = doc(db, 'products', currentId);
        updateDoc(docRef, productData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'products', operation: 'update', requestResourceData: productData }));
        });
        toast({ title: lang === 'ar' ? "تم تحديث المنتج" : "Product Updated" });
      } else {
        const colRef = collection(db, 'products');
        const newDoc = { ...productData, createdAt: serverTimestamp() };
        addDoc(colRef, newDoc).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: newDoc }));
        });
        toast({ title: lang === 'ar' ? "تمت إضافة المنتج" : "Product Added" });
      }
    }, 0);
  };

  const handleArchiveProduct = () => {
    if (!db || !deletingProdId) return;
    const targetId = deletingProdId;
    setDeletingProdId(null);
    updateDoc(doc(db, 'products', targetId), { status: 'deleted', deletedAt: serverTimestamp() });
    toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
  };

  const handleEditClick = (prod: any) => {
    setEditingProdId(prod.id);
    setFormData({
      sku: prod.sku || '',
      nameAr: prod.nameAr || '',
      nameEn: prod.nameEn || '',
      descriptionAr: prod.descriptionAr || '',
      descriptionEn: prod.descriptionEn || '',
      category: prod.category || 'ملكي',
      price: prod.price || 0,
      status: prod.status || 'available',
      image: prod.image || '',
    });
    setIsAddDialogOpen(true);
  };

  const toggleSort = (key: 'sku' | 'nameAr' | 'price') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name (AR)', 'Category', 'Price (YER)', 'Status'];
    const rows = filtered.map(p => [
      p.sku,
      p.nameAr,
      p.category,
      p.price.toLocaleString('en-US'),
      p.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: lang === 'ar' ? "تم التصدير بنجاح" : "Exported Successfully" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'دليل المنتجات' : 'Product Catalog'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'إدارة كتالوج المعاوز والمنسوجات' : 'Master Product Catalog'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'إجمالي الأصناف' : 'SKUs'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{filtered.length}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
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
              placeholder={lang === 'ar' ? 'بحث بالكود أو اسم المنتج...' : 'Quick search catalog...'}
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
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-lg border-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('sku')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'كود المنتج' : 'SKU'}
                  {sortBy === 'sku' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('price')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'السعر' : 'Price'}
                  {sortBy === 'price' && (sortOrder === 'asc' ? <ArrowUp01 className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown10 className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'حسب الفئة' : 'CATEGORY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="text-xs font-bold">الكل</DropdownMenuItem>
                {categories.map(c => (
                  <DropdownMenuItem key={c} onClick={() => setCategoryFilter(c)} className="text-xs font-bold">{c}</DropdownMenuItem>
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
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'المنتج' : 'PRODUCT'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-right">{lang === 'ar' ? 'الفئة' : 'CATEGORY'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{lang === 'ar' ? 'السعر (ريال)' : 'PRICE (YER)'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{lang === 'ar' ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري جلب الكتالوج...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300">لا توجد منتجات مسجلة</TableCell></TableRow>
                ) : filtered.map((prod) => (
                  <TableRow key={prod.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                          <AvatarImage src={prod.image || undefined} className="object-cover" />
                          <AvatarFallback className="bg-emerald-50 text-emerald-600"><Tag className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs">{prod.nameAr}</span>
                          <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-wider uppercase">{prod.sku}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                        {prod.category}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="text-xs font-black text-emerald-700 tabular-nums">
                        {prod.price.toLocaleString('en-US')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                        prod.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        prod.status === 'limited' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", prod.status === 'available' ? 'bg-emerald-600' : 'bg-amber-500')} />
                        {statuses.find(s => s.value === prod.status)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 shadow-xl min-w-[180px]">
                          <DropdownMenuItem onClick={() => handleEditClick(prod)} className="gap-3 font-bold text-xs py-2.5">
                            <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingProdId(prod.id)} className="gap-3 font-bold text-xs text-red-600 py-2.5">
                            <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* SYSTEM FOOTER */}
        <div className="mt-4 flex-none bg-slate-900 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول جودة البيانات' : 'Catalog Quality Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80">
              {lang === 'ar' ? 'تعديل بيانات المنتج ينعكس فوراً على المتجر الإلكتروني العام للجمهور.' : 'Modifying product data reflects instantly on the public online store.'}
            </p>
          </div>
        </div>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[600px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-emerald-300" />
                {editingProdId ? (lang === 'ar' ? 'تعديل بيانات المعوز' : 'Edit Product') : (lang === 'ar' ? 'تعريف منتج نسيجي جديد' : 'New Product Definition')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Definition of final goods & market SKUs</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveProduct} className="p-6 space-y-4 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100">
              <div 
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                <Avatar className="h-24 w-24 rounded-2xl border-4 border-slate-100 shadow-md bg-slate-50 overflow-hidden">
                  <AvatarImage src={formData.image || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-50 text-slate-300">
                    {isCompressing ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <ImageIcon className="w-12 h-12" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Label className="text-[10px] font-black uppercase text-slate-400">صورة المنتج النهائية</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Hash className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'كود التخزين' : 'AUTO SKU'}
                </Label>
                <Input value={editingProdId ? formData.sku : 'AUTO-GENERATE'} disabled className="h-10 font-bold text-xs bg-slate-100 text-slate-500 tabular-nums" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'فئة المعوز' : 'CATEGORY'}
                </Label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Languages className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'الاسم بالعربي' : 'ARABIC NAME'}
                </Label>
                <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'سعر البيع' : 'UNIT PRICE'}
                </Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'حالة التوفر' : 'AVAILABILITY'}
              </Label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                {statuses.map(s => <option key={s.value} value={s.value}>{lang === 'ar' ? s.labelAr : s.labelEn}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                {lang === 'ar' ? 'وصف المنتج (عربي)' : 'ARABIC DESCRIPTION'}
              </Label>
              <textarea 
                value={formData.descriptionAr} 
                onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})} 
                className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج') : 'Commit Product'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 rounded-md">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!deletingProdId} onOpenChange={(open) => !open && setDeletingProdId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة المنتج' : 'Archive Product'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' ? 'سيتم إخفاء هذا المنتج من المتجر العام ونقله لسلة المهملات.' : 'Product will be hidden from public store and moved to trash.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveProduct} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingProdId(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
