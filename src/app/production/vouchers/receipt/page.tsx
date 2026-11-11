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
  getDoc, 
  increment,
  arrayUnion
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { ReceiptHeader } from './components/ReceiptHeader';
import { ReceiptTable } from './components/ReceiptTable';
import { ReceiptFormDialog } from './components/ReceiptFormDialog';
import { ReceiptPrintPreview } from './components/ReceiptPrintPreview';
import { ReceiptDeleteDialog } from './components/ReceiptDeleteDialog';

export default function ProductionReceiptPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const isRtl = lang === 'ar';

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'qtyAccepted'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchFilter, setBatchFilter] = useState('all');

  const [systemCurrency, setSystemCurrency] = useState('YER');
  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'global')).then(snap => {
      if (snap.exists()) setSystemCurrency(snap.data().baseCurrency || 'YER');
    });
  }, [db]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    linkedMIVs: [] as string[], 
    isFinalSettlement: true,
    notes: '',
    qtyAccepted: 0, 
    wageRate: 0,
    currency: systemCurrency,
    returnedItems: [] as any[],
    transferToWarehouse: false 
  });

  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const mivQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allMIVs } = useCollection<any>(mivQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const filteredVouchers = useMemo(() => {
    let list = (vouchers || []).filter(v => v.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(v => {
        const order = allOrders?.find(o => o.id === v.orderId);
        const worker = allWorkers?.find(w => w.id === v.workerId);
        return v.voucherNumber?.toLowerCase().includes(s) || order?.orderNumber?.toLowerCase().includes(s) || worker?.fullName?.toLowerCase().includes(s);
      });
    }
    if (batchFilter !== 'all') list = list.filter(v => v.orderId === batchFilter);
    return list.sort((a, b) => {
      let vA = a[sortBy] ?? '', vB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(vA).getTime() - new Date(vB).getTime() : new Date(vB).getTime() - new Date(vA).getTime();
      return sortOrder === 'asc' ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, sortBy, sortOrder]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || !formData.orderId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    const wageAmount = Number(formData.qtyAccepted) * Number(formData.wageRate);
    const selectedOrder = allOrders?.find(o => o.id === formData.orderId);

    const voucherData = {
      ...formData,
      currentStageId: selectedOrder?.currentStageId || '',
      qtyAccepted: Number(formData.qtyAccepted),
      wageAmount,
      totalQty: Number(formData.qtyAccepted),
      type: 'production_receipt',
      status: 'posted',
      paymentStatus: 'pending', 
      paidAmount: 0,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        const oldSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldV = oldSnap.data();
        if (oldV) {
          batch.update(doc(db, 'productionOrders', oldV.orderId), { completedQty: increment(-oldV.qtyAccepted) });
          oldV.returnedItems?.forEach((item: any) => batch.update(doc(db, 'materials', item.id), { currentQty: increment(-item.qty) }));
        }
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `PRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      batch.update(doc(db, 'productionOrders', formData.orderId), { completedQty: increment(Number(formData.qtyAccepted)) });
      formData.returnedItems.forEach(item => batch.update(doc(db, 'materials', item.id), { currentQty: increment(Number(item.qty)) }));

      // LOGIC: Transfer to Internal ERP Warehouse
      if (formData.transferToWarehouse) {
        const whRef = doc(db, 'finishedGoodsWarehouse', selectedOrder?.productId);
        batch.set(whRef, { 
          totalQty: increment(Number(formData.qtyAccepted)),
          updatedAt: serverTimestamp(),
          history: arrayUnion({ 
            date: formData.date, 
            qty: Number(formData.qtyAccepted), 
            orderId: formData.orderId, 
            orderNumber: selectedOrder?.orderNumber || '',
            voucherNo: 'PRV' 
          })
        }, { merge: true });
      }

      if (formData.isFinalSettlement) formData.linkedMIVs.forEach(id => batch.update(doc(db, 'vouchers', id), { status: 'settled', updatedAt: serverTimestamp() }));

      await batch.commit();
      toast({ title: isRtl ? "تم التوريد والترحيل بنجاح" : "Success" });
      setIsAddDialogOpen(false);
      setEditingVoucherId(null);
      setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedMIVs: [], isFinalSettlement: true, notes: '', qtyAccepted: 0, wageRate: 0, currency: systemCurrency, returnedItems: [], transferToWarehouse: false });
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteRequest = async () => {
    if (!db || !deletingVoucher) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      batch.update(doc(db, 'productionOrders', deletingVoucher.orderId), { completedQty: increment(-deletingVoucher.qtyAccepted) });
      deletingVoucher.returnedItems?.forEach((item: any) => batch.update(doc(db, 'materials', item.id), { currentQty: increment(-item.qty) }));
      deletingVoucher.linkedMIVs?.forEach((id: string) => batch.update(doc(db, 'vouchers', id), { status: 'posted' }));
      batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: isRtl ? "تم الإلغاء وعكس التأثير" : "Archived & Reversed" });
    } finally { setIsSubmitting(false); setDeletingVoucher(null); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      <ReceiptHeader 
        lang={lang} dir={dir} search={search} setSearch={setSearch} batchFilter={batchFilter} setBatchFilter={setBatchFilter}
        sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
        activeOrders={allOrders || []} onAdd={() => setIsAddDialogOpen(true)} onExport={() => {}}
      />
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <ReceiptTable 
          loading={vouchersLoading} vouchers={filteredVouchers} allWorkers={allWorkers || []} allOrders={allOrders || []}
          lang={lang} dir={dir} onPrint={(v) => setPrintingVoucher(v)} onEdit={(v) => { setEditingVoucherId(v.id); setFormData({ ...v }); setIsAddDialogOpen(true); }}
          onDelete={(v) => setDeletingVoucher(v)}
        />
      </div>

      <ReceiptFormDialog 
        isOpen={isAddDialogOpen} onClose={() => { setIsAddDialogOpen(false); setEditingVoucherId(null); }}
        editingId={editingVoucherId} lang={lang} dir={dir} isSubmitting={isSubmitting} formData={formData} setFormData={setFormData}
        allOrders={allOrders || []} allWorkers={allWorkers || []} allDepartments={allDepartments || []} allMIVs={allMIVs || []}
        allProducts={allProducts || []} vouchers={vouchers || []} systemCurrency={systemCurrency} onSubmit={handleSaveVoucher}
      />

      <ReceiptPrintPreview 
        isOpen={!!printingVoucher} onClose={() => setPrintingVoucher(null)} voucher={printingVoucher}
        lang={lang} allOrders={allOrders || []} allWorkers={allWorkers || []} allDepartments={allDepartments || []}
        allProducts={allProducts || []} isDownloading={isDownloading} onDownload={async () => {
          const el = document.getElementById('printable-voucher');
          if (!el) return;
          setIsDownloading(true);
          try { await new Promise(r => setTimeout(r, 800)); const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 }); const link = document.createElement('a'); link.download = `Settlement-${printingVoucher.voucherNumber}.png`; link.href = dataUrl; link.click(); } finally { setIsDownloading(false); }
        }}
      />

      <ReceiptDeleteDialog isOpen={!!deletingVoucher} onClose={() => setDeletingVoucher(null)} lang={lang} isSubmitting={isSubmitting} onDelete={handleDeleteRequest} />

      <div className="flex-none p-2.5 bg-slate-900 text-white/50 flex items-center justify-center gap-3">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[10px] font-bold tracking-tight">{isRtl ? 'نظام الرقابة الميدانية: تصفية العهد المفتوحة وتوريد المنجز للمستودع النهائي.' : 'Production Control Active.'}</p>
      </div>
    </div>
  );
}