'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  writeBatch, 
  getDoc 
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { IssueHeader } from './components/IssueHeader';
import { IssueTable } from './components/IssueTable';
import { IssueFormDialog } from './components/IssueFormDialog';
import { IssuePrintPreview } from './components/IssuePrintPreview';
import { IssueDeleteDialog } from './components/IssueDeleteDialog';

export default function MaterialIssuePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const filterOrderId = searchParams.get('orderId');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Fetch Global Settings for Currency
  const [systemCurrency, setSystemCurrency] = useState('YER');
  
  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'global')).then(snap => {
      if (snap.exists()) setSystemCurrency(snap.data().baseCurrency || 'YER');
    });
  }, [db]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: filterOrderId || '',
    workerId: '',
    notes: '',
    items: [] as any[]
  });

  // Data Fetching
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const allVouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('status', '!=', 'deleted')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: materials } = useCollection<any>(materialsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allVouchers, loading: vouchersLoading } = useCollection<any>(allVouchersQuery);

  const vouchers = useMemo(() => (allVouchers || []).filter(v => v.type === 'material_issue'), [allVouchers]);
  const productionReceipts = useMemo(() => (allVouchers || []).filter(v => v.type === 'production_receipt'), [allVouchers]);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status === 'active'), [allOrders]);
  const activeDepartments = useMemo(() => (allDepartments || []).filter(d => d.status === 'active'), [allDepartments]);

  const filteredVouchers = useMemo(() => {
    let result = vouchers.filter(v => {
      const order = allOrders?.find(o => o.id === v.orderId);
      const worker = allWorkers?.find(w => w.id === v.workerId);
      const s = search.toLowerCase();
      const matchesSearch = v.voucherNumber?.toLowerCase().includes(s) || order?.orderNumber?.toLowerCase().includes(s) || worker?.fullName?.toLowerCase().includes(s);
      const matchesBatch = batchFilter === 'all' || v.orderId === batchFilter;
      const matchesDept = deptFilter === 'all' || worker?.departmentId === deptFilter;
      return matchesSearch && matchesBatch && matchesDept;
    });
    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'totalAmount') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, deptFilter, sortBy, sortOrder]);

  const availableOrderProducts = useMemo(() => {
    if (!formData.orderId || !productionReceipts || !allProducts) return [];
    const order = allOrders?.find(o => o.id === formData.orderId);
    const product = allProducts?.find(p => p.id === order?.productId);
    if (!product) return [];

    // Calculate available based on all previous receipts for this order minus previous transfers in MIVs
    const totalReceived = productionReceipts.filter(r => r.orderId === formData.orderId).reduce((sum, r) => sum + (r.qtyAccepted || 0), 0);
    const totalIssued = vouchers.filter(v => v.orderId === formData.orderId && v.id !== editingVoucherId).reduce((sum, v) => {
      const productItems = v.items?.filter((i: any) => i.itemType === 'product') || [];
      return sum + productItems.reduce((s: number, i: any) => s + i.qty, 0);
    }, 0);

    const left = Math.max(0, totalReceived - totalIssued);
    return left > 0 ? [{ id: product.id, nameAr: product.nameAr, image: product.image, sku: product.sku, availableQty: left, unit: 'Pcs' }] : [];
  }, [formData.orderId, productionReceipts, allOrders, allProducts, vouchers, editingVoucherId]);

  const resetDialog = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', notes: '', items: [] });
  }, []);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    
    // Financial Impact: Only materials count towards total amount
    const totalAmount = formData.items.filter(i => i.itemType === 'material').reduce((acc, i) => acc + (i.qty * (i.price || 0)), 0);
    
    const worker = allWorkers?.find(w => w.id === formData.workerId);
    const voucherData = {
      ...formData,
      supervisorId: worker?.supervisorId || '',
      type: 'material_issue',
      totalAmount,
      currency: systemCurrency,
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        const oldSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldV = oldSnap.data();
        oldV?.items.forEach((item: any) => {
          if (item.itemType === 'material') {
            const m = materials?.find(mat => mat.id === item.id);
            if (m) batch.update(doc(db, 'materials', item.id), { currentQty: (m.currentQty || 0) + item.qty });
          }
        });
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `MIV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      formData.items.forEach(item => {
        if (item.itemType === 'material') {
          const m = materials?.find(mat => mat.id === item.id);
          if (m) batch.update(doc(db, 'materials', item.id), { currentQty: (m.currentQty || 0) - item.qty });
        }
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم الحفظ وتحديث المخزون" : "Success" });
      resetDialog();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteVoucher = async () => {
    if (!db || !deletingVoucher) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      deletingVoucher.items.forEach((item: any) => {
        if (item.itemType === 'material') {
          const m = materials?.find(mat => mat.id === item.id);
          if (m) batch.update(doc(db, 'materials', item.id), { currentQty: (m.currentQty || 0) + item.qty });
        }
      });
      batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: lang === 'ar' ? "تم الإلغاء وإرجاع المخزون" : "Reversed" });
    } finally { setIsSubmitting(false); setDeletingVoucher(null); }
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('printable-voucher');
    if (!el || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const dataUrl = await toPng(el, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2, 
        cacheBust: true,
        fontEmbedCSS: '' 
      });
      const link = document.createElement('a');
      link.download = `MIV-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl; link.click();
    } finally { setIsDownloading(false); }
  };

  const handleExportCSV = () => {
    const headers = ['Ref', 'Date', 'Worker', 'Amount', 'Currency'];
    const rows = filteredVouchers.map(v => [v.voucherNumber, v.date, allWorkers?.find(w => w.id === v.workerId)?.fullName, v.totalAmount, systemCurrency]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `MIV_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      <IssueHeader 
        lang={lang} dir={dir} search={search} setSearch={setSearch} 
        handleExportCSV={handleExportCSV} batchFilter={batchFilter} setBatchFilter={setBatchFilter}
        deptFilter={deptFilter} setDeptFilter={setDeptFilter}
        toggleSort={(f) => { setSortBy(f); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
        sortBy={sortBy} sortOrder={sortOrder} activeOrders={activeOrders} activeDepartments={activeDepartments}
        setIsAddDialogOpen={setIsAddDialogOpen}
      />

      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <IssueTable 
          loading={vouchersLoading} vouchers={filteredVouchers} allOrders={allOrders || []} 
          allWorkers={allWorkers || []} lang={lang} dir={dir}
          onView={(v) => setPrintingVoucher(v)}
          onEdit={(v) => { setEditingVoucherId(v.id); setFormData({ ...v }); setIsAddDialogOpen(true); }}
          onDelete={(v) => setDeletingVoucher(v)}
        />
      </div>

      <IssueFormDialog 
        isOpen={isAddDialogOpen} onClose={resetDialog} editingId={editingVoucherId}
        lang={lang} dir={dir} isSubmitting={isSubmitting} formData={formData} setFormData={setFormData}
        activeOrders={activeOrders} activeDepartments={activeDepartments} allWorkers={allWorkers || []}
        materials={materials || []} availableOrderProducts={availableOrderProducts} handleSave={handleSaveVoucher}
      />

      <IssuePrintPreview 
        isOpen={!!printingVoucher} onClose={() => setPrintingVoucher(null)} voucher={printingVoucher}
        lang={lang} allOrders={allOrders || []} allWorkers={allWorkers || []} allDepartments={allDepartments || []}
        allProducts={allProducts || []} isDownloading={isDownloading} handleDownload={handleDownloadImage}
      />

      <IssueDeleteDialog 
        isOpen={!!deletingVoucher} onClose={() => setDeletingVoucher(null)} lang={lang}
        isSubmitting={isSubmitting} handleDelete={handleDeleteVoucher}
      />

      <div className="flex-none p-2.5 bg-slate-900 dark:bg-slate-900/80 text-white/50 flex items-center justify-center gap-3 border-t border-white/5 shadow-2xl">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' ? 'نظام الرقابة المخزنية: صرف المواد الخام يقلل الرصيد المباشر ويحمل التكلفة على الدفعة.' : 'Inventory Audit System Active.'}
        </p>
      </div>
    </div>
  );
}