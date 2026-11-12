'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  increment,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Info, History } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

// Compound Components
import { MaterialsHeader } from './components/MaterialsHeader';
import { MaterialsCatalog } from './components/MaterialsCatalog';
import { MaterialsLog } from './components/MaterialsLog';
import { MaterialsFormDialog } from './components/MaterialsFormDialog';
import { MaterialsStockInDialog } from './components/MaterialsStockInDialog';
import { useProduction } from '../ProductionContext';

export default function MaterialsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // استيراد الصلاحيات
  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.materials?.create;
  const canEdit = isAdmin || permissions.materials?.edit;
  const canDelete = isAdmin || permissions.materials?.delete;

  // State Management
  const [activeTab, setActiveTab] = useState('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'code' | 'nameAr' | 'currentQty' | 'price'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockInDialogOpen, setIsStockInDialogOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [deletingMatId, setDeletingMatId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Fetch Global Settings for Currency (Real-time listener)
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  const systemCurrency = savedSettings?.baseCurrency || 'YER';

  // Form State
  const [formData, setFormData] = useState({
    code: '', nameAr: '', nameEn: '', category: 'yarn', unit: 'kg', 
    currentQty: 0, minQty: 0, price: 0, currency: systemCurrency, 
    photoUrl: '', status: 'active'
  });

  // CRITICAL FIX: Sync currency with system settings when adding new material
  useEffect(() => {
    if (!editingMatId && systemCurrency) {
      setFormData(prev => ({ ...prev, currency: systemCurrency }));
    }
  }, [systemCurrency, editingMatId, isAddDialogOpen]);

  const [stockInForm, setStockInForm] = useState({ materialId: '', qty: 0 });

  // Data Queries
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const transactionsQuery = useMemo(() => !db ? null : query(collection(db, 'inventoryTransactions'), orderBy('createdAt', 'desc')), [db]);

  const { data: materials, loading: mLoading } = useCollection<any>(materialsQuery);
  const { data: transactions, loading: tLoading } = useCollection<any>(transactionsQuery);

  const categories = [
    { value: 'yarn', labelAr: 'الخيوط', labelEn: 'Yarn' },
    { value: 'dye', labelAr: 'الأصباغ', labelEn: 'Dyes' },
    { value: 'prep', labelAr: 'التحضير والنسيج', labelEn: 'Prep & Weaving' },
    { value: 'sewing', labelAr: 'الخياطة', labelEn: 'Sewing' },
    { value: 'finish', labelAr: 'التجهيز', labelEn: 'Processing' },
    { value: 'packaging', labelAr: 'التغليف', labelEn: 'Packaging' },
    { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
  ];

  const units = [
    { value: 'kg', labelAr: 'كيلو (KG)', labelEn: 'Kilogram' },
    { value: 'yard', labelAr: 'ياردة (YD)', labelEn: 'Yard' },
    { value: 'roll', labelAr: 'رول (Roll)', labelEn: 'Roll' },
    { value: 'piece', labelAr: 'حبة (Pcs)', labelEn: 'Piece' },
    { value: 'spool', labelAr: 'بكرة (Spool)', labelEn: 'Spool' },
    { value: 'liter', labelAr: 'لتر (L)', labelEn: 'Liter' },
    { value: 'meter', labelAr: 'متر (M)', labelEn: 'Meter' },
  ];

  const currencies = [
    { value: 'YER', labelAr: 'ريال يمني', labelEn: 'YER' },
    { value: 'SAR', labelAr: 'ريال سعودي', labelEn: 'SAR' },
    { value: 'USD', labelAr: 'دولار أمريكي', labelEn: 'USD' },
  ];

  const filteredMaterials = useMemo(() => {
    let list = (materials || []).filter(m => m.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => m.nameAr?.includes(s) || m.nameEn?.toLowerCase().includes(s) || m.code?.includes(s));
    }
    if (categoryFilter !== 'all') list = list.filter(m => m.category === categoryFilter);
    if (statusFilter !== 'all') {
      list = list.filter(m => {
        const isLow = (m.currentQty || 0) <= (m.minQty || 0);
        return statusFilter === 'low' ? isLow : !isLow;
      });
    }
    return list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'currentQty' || sortBy === 'price') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [materials, search, categoryFilter, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    totalCount: filteredMaterials.length,
    lowStockCount: filteredMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length
  }), [filteredMaterials]);

  const handleExportCSV = () => {
    const list = activeTab === 'catalog' ? filteredMaterials : transactions || [];
    if (!list.length) {
      toast({ variant: "destructive", title: isRtl ? "لا توجد بيانات للتصدير" : "No data to export" });
      return;
    }

    let headers = [];
    let rows = [];

    if (activeTab === 'catalog') {
      headers = [
        isRtl ? 'الكود' : 'SKU',
        isRtl ? 'اسم المادة' : 'Name',
        isRtl ? 'الفئة' : 'Category',
        isRtl ? 'المخزون' : 'Stock',
        isRtl ? 'الوحدة' : 'Unit',
        isRtl ? 'السعر' : 'Price',
        isRtl ? 'العملة' : 'Currency'
      ];
      rows = list.map(m => {
        const cat = categories.find(c => c.value === m.category);
        return [
          m.code,
          m.nameAr,
          cat ? (isRtl ? cat.labelAr : cat.labelEn) : m.category,
          m.currentQty,
          m.unit,
          m.price,
          m.currency || systemCurrency
        ];
      });
    } else {
      headers = [
        isRtl ? 'التاريخ' : 'Date',
        isRtl ? 'المادة' : 'Material',
        isRtl ? 'النوع' : 'Type',
        isRtl ? 'الكمية' : 'Qty'
      ];
      rows = list.map(t => {
        const mat = materials?.find((m: any) => m.id === t.materialId);
        return [
          t.createdAt?.toDate?.().toLocaleString() || '',
          mat ? mat.nameAr : '---',
          t.type,
          t.qty
        ];
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: isRtl ? "تم تحميل ملف CSV" : "CSV Downloaded" });
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing || formData.currentQty < 0) return;

    if (editingMatId && !canEdit) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتعديل" : "Permission Denied" });
      return;
    }
    if (!editingMatId && !canCreate) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالإدراج" : "Permission Denied" });
      return;
    }

    setIsSubmitting(true);
    const materialData = {
      ...formData,
      code: editingMatId ? formData.code : `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      currentQty: Number(formData.currentQty),
      minQty: Number(formData.minQty),
      price: Number(formData.price),
      currency: formData.currency || systemCurrency,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingMatId) {
        await updateDoc(doc(db, 'materials', editingMatId), materialData);
      } else {
        const docRef = await addDoc(collection(db, 'materials'), { ...materialData, createdAt: serverTimestamp() });
        // Log Initial Transaction
        await addDoc(collection(db, 'inventoryTransactions'), {
          materialId: docRef.id,
          qty: materialData.currentQty,
          type: 'opening',
          createdAt: serverTimestamp()
        });
      }
      toast({ title: isRtl ? "تم الحفظ بنجاح" : "Success" });
      resetForm();
    } finally { setIsSubmitting(false); }
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !stockInForm.materialId || stockInForm.qty <= 0) return;
    
    if (!canCreate) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتوريد" : "Permission Denied" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'materials', stockInForm.materialId), {
        currentQty: increment(stockInForm.qty),
        updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, 'inventoryTransactions'), {
        materialId: stockInForm.materialId,
        qty: stockInForm.qty,
        type: 'supply',
        createdAt: serverTimestamp()
      });
      toast({ title: isRtl ? "تم توريد الكمية" : "Stock Supplied" });
      setIsStockInDialogOpen(false);
      setStockInForm({ materialId: '', qty: 0 });
    } finally { setIsSubmitting(false); }
  };

  const handleArchiveMaterial = async () => {
    if (!db || !deletingMatId || !canDelete) return;
    await updateDoc(doc(db, 'materials', deletingMatId), { status: 'deleted', deletedAt: serverTimestamp() });
    setDeletingMatId(null);
    toast({ title: isRtl ? "تم الأرشفة" : "Archived" });
  };

  const resetForm = () => {
    setIsAddDialogOpen(false);
    setEditingMatId(null);
    setFormData({ code: '', nameAr: '', nameEn: '', category: 'yarn', unit: 'kg', currentQty: 0, minQty: 0, price: 0, currency: systemCurrency, photoUrl: '', status: 'active' });
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
        const MAX_SIZE = 200;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.7) }));
        setIsCompressing(false);
      };
    };
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir} className="flex flex-col h-full bg-[#f1f5f9] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* HEADER WITH INTEGRATED TABS */}
      <MaterialsHeader 
        lang={lang} dir={dir} search={search} setSearch={setSearch} stats={stats} loading={mLoading}
        onExport={handleExportCSV} onAdd={() => setIsAddDialogOpen(true)} onStockIn={() => setIsStockInDialogOpen(true)}
        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        sortBy={sortBy} toggleSort={(k) => { if (sortBy === k) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(k); setSortOrder('asc'); } }}
        sortOrder={sortOrder} categories={categories}
        canCreate={canCreate}
      />

      <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <TabsContent value="catalog" className="flex-1 min-h-0 focus-visible:ring-0 mt-0 data-[state=active]:flex flex-col overflow-hidden">
              <MaterialsCatalog 
                loading={mLoading} filteredMaterials={filteredMaterials} categories={categories} 
                lang={lang} dir={dir} onStockIn={(id) => { setStockInForm({ materialId: id, qty: 1 }); setIsStockInDialogOpen(true); }}
                onEdit={(mat) => { setEditingMatId(mat.id); setFormData({...mat}); setIsAddDialogOpen(true); }}
                onDelete={(id) => setDeletingMatId(id)} sortBy={sortBy} sortOrder={sortOrder} toggleSort={(k) => setSortBy(k)}
                canEdit={canEdit} canDelete={canDelete} canCreate={canCreate}
              />
          </TabsContent>

          <TabsContent value="logs" className="flex-1 min-h-0 focus-visible:ring-0 mt-0 data-[state=active]:flex flex-col overflow-hidden">
              <MaterialsLog loading={tLoading} transactions={transactions || []} materials={materials || []} lang={lang} />
          </TabsContent>
        </div>

        {/* SYSTEM FOOTER */}
        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner transition-colors duration-300">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">
              {isRtl ? 'بروتوكول حماية المخزون' : 'Stock Protection Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 font-bold opacity-80">
              {isRtl ? 'كل حركة توريد أو صرف موثقة تاريخياً لضمان الشفافية التامة في أرصدة المستودعات.' : 'Every supply or issue is historically documented to ensure full transparency.'}
            </p>
          </div>
        </div>
      </div>

      <MaterialsFormDialog 
        isOpen={isAddDialogOpen} onClose={resetForm} onSubmit={handleSaveMaterial}
        formData={formData} setFormData={setFormData} editingId={editingMatId}
        isSubmitting={isSubmitting} isCompressing={isCompressing} onImageUpload={handleImageUpload}
        lang={lang} categories={categories} units={units} currencies={currencies}
      />

      <MaterialsStockInDialog 
        isOpen={isStockInDialogOpen} onClose={() => setIsStockInDialogOpen(false)}
        onSubmit={handleStockInSubmit} formData={stockInForm} setFormData={setSortBy as any}
        materials={materials || []} isSubmitting={isSubmitting} lang={lang}
      />

      <AlertDialog open={!!deletingMatId} onOpenChange={(open) => !open && setDeletingMatId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden text-right dark:bg-slate-900" dir={dir}>
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'أرشفة الصنف' : 'Confirm Archive'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {isRtl ? 'سيتم نقل هذه المادة للأرشيف. يمكنك استعادتها لاحقاً من سلة المهملات.' : 'Item will be moved to archive.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveMaterial} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg">
              {isRtl ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700">
              {isRtl ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
