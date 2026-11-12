'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Workflow, 
  Building2, 
  UserCheck, 
  Hash, 
  Check, 
  Target, 
  Wallet, 
  RefreshCcw, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  Box,
  Truck
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ReceiptFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  lang: string;
  dir: string;
  isSubmitting: boolean;
  formData: any;
  setFormData: (v: any) => void;
  allOrders: any[];
  allWorkers: any[];
  allDepartments: any[];
  allMIVs: any[];
  allProducts: any[];
  vouchers: any[];
  systemCurrency: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function ReceiptFormDialog({
  isOpen, onClose, editingId, lang, dir, isSubmitting, formData, setFormData,
  allOrders, allWorkers, allDepartments, allMIVs, allProducts, vouchers, 
  systemCurrency, onSubmit
}: ReceiptFormDialogProps) {
  const isRtl = lang === 'ar';
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [mivSearch, setMivSearch] = useState('');
  const [currentItem, setCurrentItem] = useState({ id: '', qty: 0 });

  const relevantWorkers = useMemo(() => {
    if (!formData.orderId || !allWorkers || !allMIVs) return [];
    let workers = allWorkers.filter(w => w.status !== 'deleted');
    if (selectedDeptId) workers = workers.filter(w => w.departmentId === selectedDeptId);
    const workerIdsWithOpenIssues = allMIVs.filter(m => m.orderId === formData.orderId && (m.status === 'posted' || m.status === 'settled')).map(m => m.workerId);
    return workers.filter(w => workerIdsWithOpenIssues.includes(w.id));
  }, [formData.orderId, selectedDeptId, allWorkers, allMIVs]);

  const openMIVs = useMemo(() => {
    if (!formData.orderId || !formData.workerId || !allMIVs) return [];
    let list = allMIVs.filter(m => m.orderId === formData.orderId && m.workerId === formData.workerId && (m.status === 'posted' || (editingId && formData.linkedMIVs.includes(m.id))));
    if (mivSearch) list = list.filter(m => m.voucherNumber?.toLowerCase().includes(mivSearch.toLowerCase()));
    return list;
  }, [formData.orderId, formData.workerId, allMIVs, editingId, formData.linkedMIVs, mivSearch]);

  const issuedMaterialsPool = useMemo(() => {
    if (!formData.linkedMIVs.length || !allMIVs || !vouchers) return [];
    const pool: Record<string, any> = {};
    formData.linkedMIVs.forEach(mivId => {
      const miv = allMIVs.find(m => m.id === mivId);
      miv?.items?.forEach((item: any) => {
        if (!pool[item.id]) pool[item.id] = { nameAr: item.nameAr, qty: 0, unit: item.unit };
        pool[item.id].qty += item.qty;
      });
    });
    vouchers.forEach(v => {
      if (v.id === editingId || v.status === 'deleted' || v.type !== 'production_receipt') return;
      if (v.linkedMIVs?.some((id: string) => formData.linkedMIVs.includes(id)) && v.returnedItems) {
        v.returnedItems.forEach((ret: any) => { if (pool[ret.id]) pool[ret.id].qty -= ret.qty; });
      }
    });
    return Object.entries(pool).map(([id, data]: [string, any]) => ({ id, ...data })).filter(item => item.qty > 0);
  }, [formData.linkedMIVs, allMIVs, vouchers, editingId]);

  const selectedOrder = allOrders?.find(o => o.id === formData.orderId);
  const targetProduct = allProducts?.find(p => p.id === selectedOrder?.productId);

  const handleReturnItem = () => {
    if (!currentItem.id || currentItem.qty <= 0) return;
    const issued = issuedMaterialsPool.find(m => m.id === currentItem.id);
    if (!issued || currentItem.qty > issued.qty) return;
    setFormData({ ...formData, returnedItems: [...formData.returnedItems.filter((i: any) => i.id !== currentItem.id), { ...issued, qty: currentItem.qty }] });
    setCurrentItem({ id: '', qty: 0 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              {editingId ? (isRtl ? 'تعديل سند تسوية' : 'Edit Settlement') : (isRtl ? 'إغلاق عهدة واستلام إنتاج' : 'New Production Settlement')}
            </DialogTitle>
            <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Full closure of material cycle and wage calculation</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6 bg-white dark:bg-slate-900 max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'تاريخ التسوية' : 'DATE'} <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100 text-right" dir={dir} required />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'أمر الإنتاج' : 'BATCH'} <Workflow className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </Label>
              <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedMIVs: []})} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 text-right" dir={dir} required>
                <option value="">{isRtl ? '-- اختر أمر الإنتاج --' : '-- Select Batch --'}</option>
                {allOrders?.map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'فلترة حسب القسم' : 'FILTER BY DEPT'} <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </Label>
              <select value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setFormData({...formData, workerId: '', linkedMIVs: []}); }} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 text-right" dir={dir}>
                <option value="">{isRtl ? 'جميع الأقسام' : 'All Departments'}</option>
                {allDepartments?.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'الموظف (الذي عليه عهدة)' : 'PERSONNEL'} <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </Label>
              <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedMIVs: []})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none disabled:opacity-50 dark:text-slate-100 text-right" dir={dir} required>
                <option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Person --'}</option>
                {relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
              </select>
            </div>
          </div>

          {formData.workerId && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[1.5rem] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> {isRtl ? 'سندات العُهد المفتوحة' : 'Open Liabilities'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input value={mivSearch} onChange={(e) => setMivSearch(e.target.value)} placeholder={isRtl ? 'بحث بالسند...' : 'Search...'} className="h-8 w-40 bg-white/80 dark:bg-slate-900 text-[10px] font-bold border-amber-100 dark:border-slate-700 dark:text-slate-100 text-right" dir={dir} />
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-amber-200 dark:border-slate-700">
                    <Checkbox id="finalSettlement" checked={formData.isFinalSettlement} onCheckedChange={(val) => setFormData({...formData, isFinalSettlement: !!val})} className="data-[state=checked]:bg-amber-600" />
                    <label htmlFor="finalSettlement" className="text-[10px] font-black text-slate-600 dark:text-slate-400 cursor-pointer">{isRtl ? 'إغلاق نهائي' : 'Final Closure'}</label>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-[150px] w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {openMIVs.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => { 
                        const exists = formData.linkedMIVs.includes(m.id); 
                        setFormData({ ...formData, linkedMIVs: exists ? formData.linkedMIVs.filter((id: string) => id !== m.id) : [...formData.linkedMIVs, m.id], returnedItems: [] }); 
                      }} 
                      className={cn(
                        "p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between", 
                        formData.linkedMIVs.includes(m.id) 
                          ? "bg-emerald-600 border-emerald-700 text-white shadow-md" 
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black">{m.voucherNumber}</span>
                        <span className="text-[8px] font-bold opacity-60">{m.date}</span>
                      </div>
                      {formData.linkedMIVs.includes(m.id) && <Check className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
               <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'المنتج المستلم' : 'PRODUCED ITEM'}</Label>
               <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <img src={targetProduct?.image || 'https://placehold.co/100'} className="w-full h-full object-cover" />
               </div>
               <p className="text-xs font-black text-slate-900 dark:text-slate-100">{targetProduct?.nameAr || '---'}</p>
            </div>
            <div className="md:col-span-8 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <Label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">{isRtl ? 'الكمية المستلمة' : 'ACCEPTED QTY'}</Label>
                  <Input type="number" step="any" value={formData.qtyAccepted || ''} onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} className="h-14 font-black text-center text-2xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30" dir="ltr" required min="0.01" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'ملاحظات الفحص' : 'QC NOTES'}</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100 text-right" dir={dir} />
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-emerald-600 dark:text-emerald-400 shadow-sm"><Wallet className="w-5 h-5" /></div>
                  <div className="flex flex-col gap-1 text-right">
                    <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase">{isRtl ? 'أجر القطعة' : 'WAGE/PCS'}</p>
                    <Input type="number" step="any" value={formData.wageRate || ''} onChange={(e) => setFormData({...formData, wageRate: Number(e.target.value)})} className="h-8 w-24 text-xs font-black text-right dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" dir="ltr" required />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 uppercase">{isRtl ? 'إجمالي المستحق' : 'SETTLEMENT'}</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {(formData.qtyAccepted * formData.wageRate).toLocaleString('en-US')} <span className="text-[10px] uppercase">{formData.currency}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-[1.5rem] space-y-4">
            <h3 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2 justify-end">
               {isRtl ? 'استرجاع المواد المتبقية للمخزن' : 'RETURN RAW MATERIALS'} <RefreshCcw className="w-3.5 h-3.5" />
            </h3>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 text-right w-full">
                <select 
                  disabled={formData.linkedMIVs.length === 0} 
                  className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100" 
                  value={currentItem.id} 
                  onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                  dir={dir}
                >
                  <option value="">{isRtl ? '-- اختر مادة للاسترجاع --' : '-- Select --'}</option>
                  {issuedMaterialsPool.map(m => (
                    <option key={m.id} value={m.id}>{m.nameAr} ({m.qty} {m.unit})</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <Input type="number" step="any" value={currentItem.qty || ''} onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })} className="h-10 font-bold text-center dark:bg-slate-800 dark:border-slate-700" placeholder="0.00" />
              </div>
              <Button type="button" onClick={handleReturnItem} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 rounded-md border-none transition-all">
                {isRtl ? 'إدراج' : 'Insert'}
              </Button>
            </div>
            {formData.returnedItems.length > 0 && (
              <div className="border border-blue-100 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <Table className="text-right">
                  <TableHeader className="bg-blue-50/50 dark:bg-slate-800">
                    <TableRow className="border-b dark:border-slate-700">
                      <TableHead className={cn("px-4 py-2 text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المادة' : 'ITEM'}</TableHead>
                      <TableHead className="text-center text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase">QTY</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.returnedItems.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-b border-blue-50 dark:border-slate-800 hover:bg-blue-50/20 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="text-xs font-bold dark:text-slate-100">{item.nameAr}</TableCell>
                        <TableCell className="text-center font-black tabular-nums dark:text-slate-100">{item.qty} {item.unit}</TableCell>
                        <TableCell>
                          <button type="button" onClick={() => setFormData({...formData, returnedItems: formData.returnedItems.filter((_: any, i: number) => i !== idx)})} className="text-rose-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={isSubmitting || !formData.workerId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl border-none transition-all active:scale-95">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
              {isRtl ? (editingId ? 'تحديث السند والمخازن' : 'ترحيل التسوية وتحديث المخازن') : 'Post Settlement'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 dark:text-slate-500 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">{isRtl ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
