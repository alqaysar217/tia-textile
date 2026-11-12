'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  X,
  PlusCircle,
  Coins
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
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProduction } from '../ProductionContext';

export default function ProductsManagementPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  
  // استيراد الصلاحيات من المحرك المركزي
  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.products?.create;
  const canEdit = isAdmin || permissions.products?.edit;
  const canDelete = isAdmin || permissions.products?.delete;

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'sku' | 'nameAr' | 'price'>('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [deletingProdId, setDeletingProdId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Fetch System Settings for Currency Lock
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  const systemCurrency = savedSettings?.baseCurrency || 'YER';

  const [formData, setFormData] = useState({
    sku: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    category: 'شبواني',
    price: 0,
    currency: systemCurrency,
    status: 'available',
    image: '',
    gallery: [] as string[]
  });

  // Sync currency with system settings when adding new product
  useEffect(() => {
    if (!editingProdId && systemCurrency) {
      setFormData(prev => ({ ...prev, currency: systemCurrency }));
    }
  }, [systemCurrency, editingProdId, isAddDialogOpen]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: products, loading } = useCollection<any>(productsQuery);

  const categories = [
    "شبواني", "ملكي", "حليسي", "بيضاني", "حديدي", "شحري", "سلاطيني", 
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
      category: 'شبواني', 
      price: 0, 
      currency: systemCurrency,
      status: 'available',
      image: '',
      gallery: []
    });
  }, [systemCurrency]);

  const compressImage = (file: File, maxSize: number = 400): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const compressed = await compressImage(file);
    setFormData(prev => ({ ...prev, image: compressed }));
    setIsCompressing(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsCompressing(true);
    const newImages = await Promise.all(files.map(file => compressImage(file, 300)));
    setFormData(prev => ({ 
      ...prev, 
      gallery: [...(prev.gallery || []), ...newImages].slice(0, 10) // Limit to 10 images
    }));
    setIsCompressing(false);
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    // حماية تنفيذية
    if (editingProdId && !canEdit) {
      toast({ variant: "destructive", title: lang === 'ar' ? "غير مسموح بالتعديل" : "Permission Denied" });
      return;
    }
    if (!editingProdId && !canCreate) {
      toast({ variant: "destructive", title: lang === 'ar' ? "غير مسموح بالإضافة" : "Permission Denied" });
      return;
    }

    setIsSubmitting(true);
    const generatedSku = editingProdId ? formData.sku : `PROD-${Math.floor(1000 + Math.random() * 9000)}`;

    const productData = {
      ...formData,
      sku: generatedSku,
      price: Number(formData.price),
      currency: formData.currency, 
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
    if (!db || !deletingProdId || !canDelete) return;
    const targetId = deletingProdId;
    setDeletingProdId(null);
    updateDoc(doc(db, 'products', targetId), { status: 'deleted', deletedAt: serverTimestamp() });
    toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
  };

  const handleEditClick = (prod: any) => {
    if (!canEdit) return;
    setEditingProdId(prod.id);
    setFormData({
      sku: prod.sku || '',
      nameAr: prod.nameAr || '',
      nameEn: prod.nameEn || '',
      descriptionAr: prod.descriptionAr || '',
      descriptionEn: prod.descriptionEn || '',
      category: prod.category || 'شبواني',
      price: prod.price || 0,
      currency: prod.currency || systemCurrency,
      status: prod.status || 'available',
      image: prod.image || '',
      gallery: prod.gallery || []
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
    const headers = ['SKU', 'Name (AR)', 'Category', 'Price', 'Currency', 'Status'];
    const rows = filtered.map(p => [
      p.sku,
      p.nameAr,
      p.category,
      p.price.toLocaleString('en-US'),
      p.currency || 'YER',
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

  const isRtl = lang === 'ar';

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'دليل المنتجات' : 'Product Catalog'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {lang === 'ar' ? 'إدارة كتالوج المعاوز والمنسوجات' : 'Master Product Catalog'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{lang === 'ar' ? 'إجمالي الأصناف' : 'SKUs'}</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{filtered.length}</p>
              </div>
            </div>
            
            {canCreate && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", dir === 'rtl' ? "right-3" : "left-3")} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالكود أو اسم المنتج...' : 'Quick search catalog...'}
              className={cn(
                dir === 'rtl' ? 'pr-10' : 'pl-10',
                "h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100"
              )}
            />
          </div>
          
          <div className="flex items-center gap-1.5 px-1.5">
            <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تصفية' : 'Filter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{lang === 'ar' ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('sku')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  {lang === 'ar' ? 'كود المنتج' : 'SKU'}
                  {sortBy === 'sku' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('price')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  {lang === 'ar' ? 'السعر' : 'Price'}
                  {sortBy === 'price' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{lang === 'ar' ? 'حسب الفئة' : 'CATEGORY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="text-xs font-bold dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">الكل</DropdownMenuItem>
                <ScrollArea className="h-40">
                  {categories.map(c => (
                    <DropdownMenuItem key={c} onClick={() => setCategoryFilter(c)} className="text-xs font-bold dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">{c}</DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b dark:border-slate-700">
                  <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{lang === 'ar' ? 'المنتج' : 'PRODUCT'}</TableHead>
                  <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{lang === 'ar' ? 'الفئة' : 'CATEGORY'}</TableHead>
                  <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">{lang === 'ar' ? 'سعر البيع' : 'UNIT PRICE'}</TableHead>
                  <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">{lang === 'ar' ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-none"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">جاري جلب الكتالوج...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">لا توجد منتجات مسجلة</TableCell></TableRow>
                ) : filtered.map((prod) => (
                  <TableRow key={prod.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                          <AvatarImage src={prod.image || undefined} className="object-cover" />
                          <AvatarFallback className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"><Tag className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{prod.nameAr}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tabular-nums tracking-wider uppercase">{prod.sku}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase">
                        {prod.category}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {prod.price.toLocaleString('en-US')}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{prod.currency || 'YER'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                        prod.status === 'available' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 
                        prod.status === 'limited' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", prod.status === 'available' ? 'bg-emerald-600' : 'bg-amber-500')} />
                        {statuses.find(s => s.value === prod.status)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border-l dark:border-slate-800">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl min-w-[180px]">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleEditClick(prod)} className="gap-3 font-bold text-xs py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="dark:bg-slate-800" />
                          {canDelete && (
                            <DropdownMenuItem onClick={() => setDeletingProdId(prod.id)} className="gap-3 font-bold text-xs text-red-600 dark:text-rose-400 py-2.5 focus:bg-rose-50 dark:focus:bg-rose-900/20">
                              <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive'}
                            </DropdownMenuItem>
                          )}
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
        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner transition-colors duration-300">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 shrink-0"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول جودة البيانات' : 'Catalog Quality Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 font-bold opacity-80 leading-relaxed">
              {lang === 'ar' ? 'تعديل بيانات المنتج ينعكس فوراً على المتجر الإلكتروني العام للجمهور. الحذف يتم عبر نقل السجل للأرشيف لضمان إمكانية استرجاعه.' : 'Modifying product data reflects instantly on the public online store.'}
            </p>
          </div>
        </div>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[700px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className={cn("text-right", !isRtl && "text-left")}>
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <LayoutGrid className="w-5 h-5 text-emerald-300" />
                {editingProdId ? (lang === 'ar' ? 'تعديل بيانات المعوز' : 'Edit Product') : (lang === 'ar' ? 'تعريف منتج نسيجي جديد' : 'New Product Definition')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Definition of final goods & market SKUs</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveProduct} className="p-6 space-y-6 bg-white dark:bg-slate-900 max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* IMAGE SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Main Image */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block text-center">الصورة الرئيسية</Label>
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className="relative group cursor-pointer aspect-square rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center"
                >
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={formData.image || undefined} className="object-cover w-full h-full" />
                    {!formData.image && (
                      <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 w-full h-full flex flex-col items-center justify-center">
                        {isCompressing ? <Loader2 className="w-12 h-12 animate-spin text-emerald-500" /> : <ImageIcon className="w-16 h-16" />}
                        <p className="text-[10px] font-bold mt-2">انقر للرفع</p>
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMainImageUpload} />
              </div>

              {/* Gallery Images */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block text-center">صور التشكيلات والألوان (الكتالوج)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group/item">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={img} className="w-full h-full object-cover" />
                        <AvatarFallback className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                      </Avatar>
                      <button 
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formData.gallery.length < 10 && (
                    <button 
                      type="button"
                      onClick={() => !isCompressing && galleryInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-400 dark:hover:text-emerald-400 transition-all"
                    >
                      <PlusCircle className="w-8 h-8" />
                      <span className="text-[8px] font-black mt-1 uppercase">إضافة</span>
                    </button>
                  )}
                </div>
                <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold text-center mt-2 italic">* يمكنك إضافة حتى 10 صور لاستعراض الألوان والنقشات المختلفة.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                  <Hash className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'كود التخزين' : 'AUTO SKU'}
                </Label>
                <Input value={editingProdId ? formData.sku : 'AUTO-GENERATE'} disabled className="h-10 font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums border-slate-200 dark:border-slate-700" />
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                  <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'فئة المعوز' : 'CATEGORY'}
                </Label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                  <Languages className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'الاسم بالعربي' : 'ARABIC NAME'}
                </Label>
                <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100" required />
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                  <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'سعر البيع' : 'UNIT PRICE'}
                </Label>
                <div className="flex gap-2">
                  <Input type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums flex-1 dark:text-slate-100" required />
                  <select 
                    value={formData.currency} 
                    disabled 
                    className="w-24 h-10 px-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold outline-none cursor-not-allowed text-slate-500 dark:text-slate-400"
                  >
                    <option value="YER">YER</option>
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'حالة التوفر' : 'AVAILABILITY'}
              </Label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100">
                {statuses.map(s => <option key={s.value} value={s.value}>{lang === 'ar' ? s.labelAr : s.labelEn}</option>)}
              </select>
            </div>

            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start")}>
                {lang === 'ar' ? 'وصف المنتج (عربي)' : 'ARABIC DESCRIPTION'}
              </Label>
              <textarea 
                value={formData.descriptionAr} 
                onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})} 
                className="w-full min-h-[80px] p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium outline-none resize-none dark:text-slate-300"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج') : 'Commit Product'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 dark:text-slate-500 rounded-md border border-slate-200 dark:border-slate-700">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!deletingProdId} onOpenChange={(open) => !open && setDeletingProdId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><History className="w-32 h-32 text-white" /></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة المنتج' : 'Archive Product'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
              {lang === 'ar' ? 'سيتم إخفاء هذا المنتج من المتجر العام ونقله لسلة المهملات. يمكنك استعادته خلال 30 يوماً.' : 'Product will be hidden from public store and moved to trash.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveProduct} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg">
              {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingProdId(null)} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
