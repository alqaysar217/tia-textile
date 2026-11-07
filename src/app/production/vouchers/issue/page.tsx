
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  FileInput, 
  Save, 
  Loader2, 
  Calendar,
  User,
  Workflow,
  Package,
  Trash2,
  AlertCircle,
  FileText,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Box,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from 'next/navigation';

export default function MaterialIssuePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const filterOrderId = searchParams.get('orderId');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: filterOrderId || '',
    workerId: '',
    notes: '',
    items: [] as any[]
  });

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({
    id: '',
    qty: 1
  });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : query(collection(db, 'productionOrders'), where('status', '==', 'active')), [db]);
  const workersQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('active', '==', true)), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);

  const { data: orders } = useCollection<any>(ordersQuery);
  const { data: workers } = useCollection<any>(workersQuery);
  const { data: materials } = useCollection<any>(materialsQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter(v => {
      const order = orders?.find(o => o.id === v.orderId);
      const worker = workers?.find(w => w.id === v.workerId);
      const s = search.toLowerCase();
      return (
        v.voucherNumber?.toLowerCase().includes(s) ||
        order?.orderNumber?.toLowerCase().includes(s) ||
        worker?.fullName?.toLowerCase().includes(s)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vouchers, orders, workers, search]);

  const handleAddItem = () => {
    if (!currentItem.id || currentItem.qty <= 0) return;
    const material = materials?.find(m => m.id === currentItem.id);
    if (!material) return;

    if (material.currentQty < currentItem.qty) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "كمية غير كافية" : "Insufficient Stock",
        description: lang === 'ar' ? `المتوفر في المخزن فقط ${material.currentQty}` : `Available stock is only ${material.currentQty}`
      });
      return;
    }

    const existingIdx = formData.items.findIndex(i => i.id === currentItem.id);
    if (existingIdx > -1) {
      const newItems = [...formData.items];
      newItems[existingIdx].qty += currentItem.qty;
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ 
        ...formData, 
        items: [...formData.items, { 
          id: material.id, 
          nameAr: material.nameAr, 
          qty: currentItem.qty, 
          unit: material.unit,
          price: material.price || 0
        }] 
      });
    }
    setCurrentItem({ id: '', qty: 1 });
  };

  const removeItem = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    const voucherNumber = `MIV-${Date.now().toString().slice(-6)}`;
    
    const totalAmount = formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    const voucherData = {
      voucherNumber,
      type: 'material_issue',
      orderId: formData.orderId,
      workerId: formData.workerId,
      date: formData.date,
      items: formData.items,
      totalAmount,
      status: 'posted',
      notes: formData.notes,
      createdAt: serverTimestamp()
    };

    try {
      // 1. Create Voucher
      const voucherRef = doc(collection(db, 'vouchers'));
      batch.set(voucherRef, voucherData);

      // 2. Update Material Quantities
      formData.items.forEach(item => {
        const material = materials?.find(m => m.id === item.id);
        if (material) {
          const matRef = doc(db, 'materials', item.id);
          batch.update(matRef, {
            currentQty: (material.currentQty || 0) - item.qty,
            updatedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم إصدار السند بنجاح" : "Voucher Issued Successfully" });
      setIsAddDialogOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', notes: '', items: [] });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error saving voucher" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <FileInput className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المخازن' : 'WMS'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'سندات الصرف' : 'Material Issues'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'صرف المواد الخام للإنتاج' : 'Material Issue Vouchers'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث برقم السند أو العامل...' : 'Search by voucher or worker...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'سند جديد' : 'New Issue'}
            </Button>
          </div>
        </div>
      </div>

      {/* LIST OF VOUCHERS */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'العامل' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'الأصناف' : 'ITEMS'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب الأرشيف...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سندات مسجلة</TableCell></TableRow>
              ) : filteredVouchers.map((v) => {
                const order = orders?.find(o => o.id === v.orderId);
                const worker = workers?.find(w => w.id === v.workerId);
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><FileText className="w-3.5 h-3.5" /></div>
                        <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums">{v.date}</TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-xs">{order?.orderNumber || '---'}</span>
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{order?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{worker?.fullName?.charAt(0)}</div>
                        <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black tabular-nums">
                        {v.items?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* NEW VOUCHER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileInput className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'إنشاء سند صرف مواد' : 'New Material Issue'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Allocating raw materials to production floor
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* 1. MASTER INFO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ السند' : 'DATE'}
                </Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج' : 'PRODUCTION ORDER'}
                </Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">{lang === 'ar' ? '-- اختر الأمر --' : '-- Select Order --'}</option>
                  {orders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <User className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'العامل المستلم' : 'RECEIVING WORKER'}
                </Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">{lang === 'ar' ? '-- اختر العامل --' : '-- Select Worker --'}</option>
                  {workers?.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
            </div>

            {/* 2. ITEM SELECTION BOX */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3 h-3" /> {lang === 'ar' ? 'إضافة أصناف الخيوط والمواد' : 'ADD RAW MATERIALS'}
              </h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'المادة' : 'ITEM'}</Label>
                  <select 
                    value={currentItem.id} 
                    onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold outline-none"
                  >
                    <option value="">{lang === 'ar' ? '-- اختر مادة من المخزن --' : '-- Select Material --'}</option>
                    {materials?.filter(m => (m.currentQty || 0) > 0).map(m => (
                      <option key={m.id} value={m.id}>{m.nameAr} ({m.currentQty} {m.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'الكمية' : 'QTY'}</Label>
                  <Input 
                    type="number" 
                    value={currentItem.qty} 
                    onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })}
                    className="h-10 font-bold text-xs bg-white tabular-nums" 
                  />
                </div>
                <Button type="button" onClick={handleAddItem} className="h-10 px-6 bg-slate-900 text-white rounded-md font-black text-xs gap-2">
                  <Plus className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إضافة للجدول' : 'Add to List'}
                </Button>
              </div>
            </div>

            {/* 3. VOUCHER ITEMS TABLE */}
            {formData.items.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table className="text-right">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase">{lang === 'ar' ? 'المادة' : 'MATERIAL'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الكمية' : 'QTY'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الوحدة' : 'UNIT'}</TableHead>
                      <TableHead className="px-4 py-2 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100">
                        <TableCell className="px-4 py-2 font-black text-slate-800 text-xs">{item.nameAr}</TableCell>
                        <TableCell className="px-4 py-2 text-center font-black text-emerald-700 text-xs tabular-nums">{item.qty}</TableCell>
                        <TableCell className="px-4 py-2 text-center text-[10px] font-bold text-slate-400">{item.unit}</TableCell>
                        <TableCell className="px-4 py-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات السند' : 'VOUCHER NOTES'}</Label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[60px] p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium resize-none outline-none" placeholder={lang === 'ar' ? 'اكتب أي ملاحظات تتعلق بصرف هذه المواد...' : 'Additional notes...'} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.items.length === 0} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-lg font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'ترحيل السند وتحديث المخزن' : 'Post Voucher & Update Stock'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-6 h-12 font-black text-slate-400 rounded-lg">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-2 bg-slate-900 text-white/40 flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><AlertCircle className="w-2.5 h-2.5" /></div>
        <p className="text-[9px] font-bold">
          {lang === 'ar' 
            ? 'تنبيه: ترحيل السند يؤدي إلى الخصم الفوري من المخازن وتحميل التكلفة على أمر الإنتاج.' 
            : 'Alert: Posting will instantly deduct from warehouse and apply cost to the order.'}
        </p>
      </div>

    </div>
  );
}
