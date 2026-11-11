'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  writeBatch 
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { Info } from 'lucide-react';

import { ReturnHeader } from './components/ReturnHeader';
import { ReturnTable } from './components/ReturnTable';
import { ReturnFormDialog } from './components/ReturnFormDialog';
import { ReturnPrintPreview } from './components/ReturnPrintPreview';

export default function MaterialReturnPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedReceiptId: '', notes: '', items: [] as any[] });

  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const returnVouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_return')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allReceipts } = useCollection<any>(receiptsQuery);
  const { data: returnVouchers } = useCollection<any>(returnVouchersQuery);

  const applyFilters = useCallback((list: any[]) => {
    let result = (list || []).filter(item => item.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => {
        const order = allOrders?.find(o => o.id === item.orderId);
        const worker = allWorkers?.find(w => w.id === item.workerId);
        return item.voucherNumber?.toLowerCase().includes(s) || worker?.fullName?.toLowerCase().includes(s) || order?.orderNumber?.toLowerCase().includes(s);
      });
    }
    if (dateFrom) result = result.filter(item => item.date >= dateFrom);
    if (dateTo) result = result.filter(item => item.date <= dateTo);
    if (workerFilter !== 'all') result = result.filter(item => item.workerId === workerFilter);
    if (orderFilter !== 'all') result = result.filter(item => item.orderId === orderFilter);
    return result.sort((a, b) => {
      const valA = a[sortBy] ?? '', valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [search, dateFrom, dateTo, workerFilter, orderFilter, sortBy, sortOrder, allOrders, allWorkers]);

  const pendingReturns = useMemo(() => applyFilters((allReceipts || []).filter(r => r.returnedItems?.length > 0 && r.returnStatus !== 'verified')), [allReceipts, applyFilters]);
  const verifiedReturns = useMemo(() => applyFilters(returnVouchers || []), [returnVouchers, applyFilters]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      const voucherData = { ...formData, type: 'material_return', status: 'posted', updatedAt: serverTimestamp() };
      const voucherNumber = `MRV-${Date.now().toString().slice(-6)}`;
      batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      if (formData.linkedReceiptId) batch.update(doc(db, 'vouchers', formData.linkedReceiptId), { returnStatus: 'verified' });
      formData.items.forEach(item => { const mat = allMaterials?.find(m => m.id === item.id); if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: (mat.currentQty || 0) + Number(item.qty) }); });
      await batch.commit();
      toast({ title: isRtl ? "تم التوثيق بنجاح" : "Success" });
      setIsAddDialogOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedReceiptId: '', notes: '', items: [] });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      <ReturnHeader 
        lang={lang} dir={dir} activeTab={activeTab} setActiveTab={setActiveTab} search={search} setSearch={setSearch}
        dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        workerFilter={workerFilter} setWorkerFilter={setWorkerFilter} orderFilter={orderFilter} setOrderFilter={setOrderFilter}
        sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
        allWorkers={allWorkers || []} allOrders={allOrders || []} onExport={() => {}}
      />
      <div className="flex-1 min-h-0 p-6 overflow-auto no-scrollbar">
        <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-3 mb-4 rounded-xl">
           <Info className="w-4 h-4 text-amber-600" />
           <p className="text-[10px] font-bold text-amber-800">{isRtl ? 'بروتوكول التدقيق: يجب مطابقة المرتجع الميداني مع السجل المخزني الفعلي قبل تأكيد الدخول.' : 'Audit Protocol Required.'}</p>
        </div>
        <ReturnTable 
          list={activeTab === 'pending' ? pendingReturns : verifiedReturns} allWorkers={allWorkers || []} allOrders={allOrders || []}
          activeTab={activeTab} lang={lang} dir={dir} onVerify={(v) => { setFormData({ date: new Date().toISOString().split('T')[0], orderId: v.orderId, workerId: v.workerId, linkedReceiptId: v.id, notes: isRtl ? `توثيق آلي للمرتجع من سند رقم ${v.voucherNumber}` : `Auto-verify ${v.voucherNumber}`, items: [...v.returnedItems] }); setIsAddDialogOpen(true); }}
          onPrint={(v) => setPrintingVoucher(v)}
        />
      </div>

      <ReturnFormDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} lang={lang} isSubmitting={isSubmitting} formData={formData} setFormData={setFormData} allWorkers={allWorkers || []} allOrders={allOrders || []} onSubmit={handleSaveVoucher} />
      <ReturnPrintPreview isOpen={!!printingVoucher} onClose={() => setPrintingVoucher(null)} voucher={printingVoucher} lang={lang} allOrders={allOrders || []} allWorkers={allWorkers || []} allDepartments={allDepartments || []} allProducts={allProducts || []} isDownloading={isDownloading} onDownload={async () => {
          const el = document.getElementById('printable-voucher');
          if (!el) return;
          setIsDownloading(true);
          try { await new Promise(r => setTimeout(r, 800)); const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2 }); const link = document.createElement('a'); link.download = `Return-${printingVoucher.voucherNumber}.png`; link.href = dataUrl; link.click(); } finally { setIsDownloading(false); }
      }} />
    </div>
  );
}
