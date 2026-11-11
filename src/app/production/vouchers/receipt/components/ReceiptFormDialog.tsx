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
      <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              {editingId ? (isRtl ? 'تعديل سند تسوية' : 'Edit Settlement') : (isRtl ? 'إغلاق عهدة واستلام إنتاج' : 'New Production Settlement')}
            </DialogTitle>
            <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Full closure of material cycle and wage calculation</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-emerald-600" /> {isRtl ? 'تاريخ التسوية' : 'DATE'}
              </Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Workflow className="w-3 h-3 text-emerald-600" /> {isRtl ? 'أمر الإنتاج' : 'BATCH'}
              </Label>
              <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedMIVs: []})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                <option value="">{isRtl ? '-- اختر أمر الإنتاج --' : '-- Select Batch --'}</option>
                {allOrders?.filter(o => o.status === 'active' || (editingId && o.id === formData.orderId)).map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Building2 className="w-3 h-3 text-emerald-600" /> {isRtl ? 'فلترة حسب القسم' : 'FILTER BY DEPT'}</Label><select value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setFormData({...formData, workerId: '', linkedMIVs: []}); }} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none"><option value="">{isRtl ? 'جميع الأقسام' : 'All Departments'}</option>{allDepartments?.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}</select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> {isRtl ? 'الموظف (الذي عليه عهدة)' : 'PERSONNEL'}</Label><select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedMIVs: []})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none disabled:opacity-50" required><option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Person --'}</option>{relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}</select></div>
          </div>

          {formData.workerId && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-[1.5rem] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1"><h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {isRtl ? 'سندات العُهد المفتوحة' : 'Open Liabilities'}</h3></div>
                <div className="flex items-center gap-3"><div className="relative"><Input value={mivSearch} onChange={(e) => setMivSearch(e.target.value)} placeholder={isRtl ? 'بحث بالسند...' : 'Search...'} className="h-8 w-40 bg-white/80 text-[10px] font-bold" /></div><div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-amber-200"><Checkbox id="finalSettlement" checked={formData.isFinalSettlement} onCheckedChange={(val) => setFormData({...formData, isFinalSettlement: !!val})} /><label htmlFor="finalSettlement" className="text-[10px] font-black text-slate-600">{isRtl ? 'إغلاق نهائي' : 'Final Closure'}</label></div></div>
              </div>
              <ScrollArea className="h-[150px] w-full"><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{openMIVs.map(m => (<div key={m.id} onClick={() => { const exists = formData.linkedMIVs.includes(m.id); setFormData({ ...formData, linkedMIVs: exists ? formData.linkedMIVs.filter((id: string) => id !== m.id) : [...formData.linkedMIVs, m.id], returnedItems: [] }); }} className={cn("p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center h-[50px]", formData.linkedMIVs.includes(m.id) ? "bg-emerald-600 border-emerald-700 text-white shadow-md" : "bg-white border-slate-100 hover:border-amber-200 text-slate-600")}><div className="flex items-center justify-between w-full px-1"><span className="text-[10px] font-black">{m.voucherNumber}</span><span className="text-[8px] font-bold opacity-60">{m.date}</span></div>{formData.linkedReceipts?.includes(m.id) && <Check className="w-3 h-3 ms-2" />}</div>))}</div></ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
               <Label className="text-[10px] font-black text-slate-400 uppercase">{isRtl ? 'المنتج المستلم' : 'PRODUCED ITEM'}</Label>
               <div className="w-20 h-20 mx-auto bg-white rounded-xl border overflow-hidden"><img src={targetProduct?.image || 'https://placehold.co/100'} className="w-full h-full object-cover" /></div>
               <p className="text-xs font-black text-slate-900">{targetProduct?.nameAr || '---'}</p>
            </div>
            <div className="md:col-span-8 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-emerald-700 uppercase">{isRtl ? 'الكمية المستلمة' : 'ACCEPTED QTY'}</Label><Input type="number" step="any" value={formData.qtyAccepted || ''} onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} className="h-14 font-black text-center text-2xl text-emerald-700 bg-emerald-50 border-emerald-200" required min="0.01" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">{isRtl ? 'ملاحظات الفحص' : 'QC NOTES'}</Label><Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-14 bg-slate-50 text-xs font-bold" /></div>
              </div>
              
              <div className="p-4 bg-emerald-900 rounded-xl text-white flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Truck className="w-5 h-5 text-emerald-300" /></div>
                    <div>
                       <p className="text-[11px] font-black uppercase tracking-widest">{isRtl ? 'الترحيل للمستودع العام' : 'Warehouse Transfer'}</p>
                       <p className="text-[9px] font-bold text-emerald-200/60">{isRtl ? 'إتاحة الكمية للبيع فوراً في المتجر' : 'Make items available for sale instantly'}</p>
                    </div>
                 </div>
                 <Checkbox 
                   id="transfer" 
                   checked={formData.transferToWarehouse} 
                   onCheckedChange={(val) => setFormData({...formData, transferToWarehouse: !!val})}
                   className="w-6 h-6 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white"
                 />
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Wallet className="w-5 h-5" /></div><div className="flex flex-col gap-1"><p className="text-[9px] font-black text-emerald-800 uppercase">{isRtl ? 'أجر القطعة' : 'WAGE/PCS'}</p><Input type="number" step="any" value={formData.wageRate || ''} onChange={(e) => setFormData({...formData, wageRate: Number(e.target.value)})} className="h-8 w-24 text-xs font-black" required /></div></div>
                <div className="text-right"><p className="text-[9px] font-black text-emerald-800 uppercase">{isRtl ? 'إجمالي المستحق' : 'SETTLEMENT'}</p><p className="text-xl font-black text-emerald-700 tabular-nums">{(formData.qtyAccepted * formData.wageRate).toLocaleString('en-US')} <span className="text-[10px]">{formData.currency}</span></p></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-[1.5rem] space-y-4">
            <h3 className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-2"><RefreshCcw className="w-3.5 h-3.5" /> {isRtl ? 'استرجاع المواد المتبقية' : 'RETURN RAW MATERIALS'}</h3>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1"><select disabled={formData.linkedMIVs.length === 0} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-md text-xs font-bold" value={currentItem.id} onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}><option value="">{isRtl ? '-- اختر مادة للاسترجاع --' : '-- Select --'}</option>{issuedMaterialsPool.map(m => (<option key={m.id} value={m.id}>{m.nameAr} ({m.qty} {m.unit})</option>))}</select></div>
              <div className="w-32"><Input type="number" step="any" value={currentItem.qty || ''} onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })} className="h-10 font-bold" /></div>
              <Button type="button" onClick={handleReturnItem} className="h-10 bg-blue-600 text-white font-black text-xs px-6 rounded-md">{isRtl ? 'إدراج' : 'Insert'}</Button>
            </div>
            {formData.returnedItems.length > 0 && (<div className="border border-blue-100 rounded-xl overflow-hidden bg-white"><Table className="text-right"><TableHeader className="bg-blue-50/50"><TableRow><TableHead className="text-right text-[9px] font-black text-blue-500 uppercase">{isRtl ? 'المادة' : 'ITEM'}</TableHead><TableHead className="text-center text-[9px] font-black text-blue-500 uppercase">QTY</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader><TableBody>{formData.returnedItems.map((item: any, idx: number) => (<TableRow key={idx} className="border-b border-blue-50"><TableCell className="text-xs font-bold">{item.nameAr}</TableCell><TableCell className="text-center font-black tabular-nums">{item.qty} {item.unit}</TableCell><TableCell><button type="button" onClick={() => setFormData({...formData, returnedItems: formData.returnedItems.filter((_: any, i: number) => i !== idx)})} className="text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></TableCell></TableRow>))}</TableBody></Table></div>)}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="submit" disabled={isSubmitting || !formData.workerId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
              {isRtl ? (editingId ? 'تحديث السند والمخازن' : 'ترحيل التسوية وتحديث المخازن') : 'Post Settlement'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">{isRtl ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
