'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileInput, 
  Save, 
  Loader2, 
  Calendar, 
  Trash2, 
  Box, 
  Users2, 
  Building2, 
  Check, 
  ChevronDown, 
  Workflow, 
  Plus, 
  UserCheck, 
  ShoppingBag, 
  ArrowRightLeft,
  Search
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface IssueFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  lang: string;
  dir: string;
  isSubmitting: boolean;
  formData: any;
  setFormData: (val: any) => void;
  activeOrders: any[];
  activeDepartments: any[];
  allWorkers: any[];
  materials: any[];
  availableOrderProducts: any[];
  handleSave: (e: React.FormEvent) => void;
}

export function IssueFormDialog({
  isOpen,
  onClose,
  editingId,
  lang,
  dir,
  isSubmitting,
  formData,
  setFormData,
  activeOrders,
  activeDepartments,
  allWorkers,
  materials,
  availableOrderProducts,
  handleSave
}: IssueFormDialogProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const isRtl = lang === 'ar';

  const workerDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target as Node)) setShowWorkerDropdown(false);
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) setShowProductDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredWorkers = useMemo(() => {
    return (allWorkers || []).filter(w => {
      if (w.status === 'deleted') return false;
      const matchesDept = selectedDeptId ? w.departmentId === selectedDeptId : true;
      const matchesSearch = (w.fullName || '').toLowerCase().includes(workerSearch.toLowerCase()) || (w.workerId || '').toLowerCase().includes(workerSearch.toLowerCase());
      return matchesDept && matchesSearch && (w.active !== false);
    });
  }, [allWorkers, selectedDeptId, workerSearch]);

  const selectedWorker = allWorkers?.find(w => w.id === formData.workerId);

  const [currentItem, setCurrentItem] = useState({
    id: '',
    qty: 1,
    type: 'material' as 'material' | 'product'
  });

  const handleAddItem = (type: 'material' | 'product') => {
    const id = currentItem.id;
    if (!id || currentItem.qty <= 0) return;

    if (type === 'material') {
      const material = materials?.find(m => m.id === id);
      if (!material) return;
      if (material.currentQty < currentItem.qty) {
        alert(isRtl ? `المتوفر فقط ${material.currentQty}` : `Only ${material.currentQty} available`);
        return;
      }
      
      const existingIdx = formData.items.findIndex((i: any) => i.id === id && i.itemType === 'material');
      if (existingIdx > -1) {
        const newItems = [...formData.items];
        newItems[existingIdx].qty += currentItem.qty;
        setFormData({ ...formData, items: newItems });
      } else {
        setFormData({ 
          ...formData, 
          items: [...formData.items, { 
            id: material.id, nameAr: material.nameAr, qty: currentItem.qty, unit: material.unit, price: material.price || 0, itemType: 'material'
          }] 
        });
      }
    } else {
      const prod = availableOrderProducts.find(p => p.id === id);
      if (!prod) return;
      if (prod.availableQty < currentItem.qty) {
        alert(isRtl ? "الكمية المتاحة أقل" : "Qty not available");
        return;
      }

      const existingIdx = formData.items.findIndex((i: any) => i.id === id && i.itemType === 'product');
      if (existingIdx > -1) {
        const newItems = [...formData.items];
        newItems[existingIdx].qty += currentItem.qty;
        setFormData({ ...formData, items: newItems });
      } else {
        setFormData({ 
          ...formData, 
          items: [...formData.items, { 
            id: prod.id, nameAr: prod.nameAr, qty: currentItem.qty, unit: prod.unit, price: 0, itemType: 'product'
          }] 
        });
      }
    }
    
    setCurrentItem({ id: '', qty: 1, type: 'material' });
    setProductSearch('');
  };

  const removeItem = (id: string, type: string) => {
    setFormData({ ...formData, items: formData.items.filter((i: any) => !(i.id === id && i.itemType === type)) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
              <FileInput className="w-5 h-5 text-emerald-300" />
              {editingId ? (isRtl ? 'تعديل سند صرف مواد ومنتجات' : 'Update Issue Voucher') : (isRtl ? 'إنشاء سند صرف مواد ومنتجات للإنتاج' : 'New Issue Voucher')}
            </DialogTitle>
            <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Issuing raw materials and semi-finished products to workers</p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 bg-white dark:bg-slate-900 max-h-[85vh] overflow-y-auto no-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'تاريخ السند' : 'DATE'} <Calendar className="w-3 h-3 text-emerald-600" />
              </Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-12 font-bold text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100" required />
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'أمر الإنتاج' : 'BATCH'} <Workflow className="w-3 h-3 text-emerald-600" />
              </Label>
              <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, items: []})} className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 text-right" dir={dir} required>
                <option value="">-- {isRtl ? 'اختر أمر الإنتاج' : 'Select Order'} --</option>
                {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'تصفية حسب القسم' : 'DEPT FILTER'} <Building2 className="w-3 h-3 text-emerald-600" />
              </Label>
              <select value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setFormData({...formData, workerId: ''}); setWorkerSearch(''); }} className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 text-right" dir={dir}>
                <option value="">{isRtl ? 'جميع الأقسام' : 'All Departments'}</option>
                {activeDepartments?.map(d => <option key={d.id} value={d.id}>{isRtl ? d.nameAr : d.nameEn}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 relative text-right" ref={workerDropdownRef}>
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                {isRtl ? 'العامل المستلم' : 'PERSONNEL'} <Users2 className="w-3 h-3 text-emerald-600" />
              </Label>
              <button type="button" onClick={() => setShowWorkerDropdown(!showWorkerDropdown)} className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm">
                <ChevronDown className="h-4 w-4 opacity-50" />
                {selectedWorker ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black dark:text-slate-100">{selectedWorker.fullName}</span>
                    <Avatar className="h-7 w-7"><AvatarImage src={selectedWorker.photoUrl} className="object-cover"/><AvatarFallback>{selectedWorker.fullName?.charAt(0)}</AvatarFallback></Avatar>
                  </div>
                ) : <span className="text-slate-400 font-bold">{isRtl ? '-- اختر العامل --' : '-- Select Worker --'}</span>}
              </button>
              {showWorkerDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700"><Input value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} placeholder="بحث..." className="h-9 text-xs font-bold dark:bg-slate-900 dark:border-slate-700" /></div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-1">
                      {filteredWorkers.map(w => (
                        <button key={w.id} type="button" onClick={() => { setFormData({...formData, workerId: w.id}); setShowWorkerDropdown(false); }} className={cn("flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", formData.workerId === w.id ? "bg-emerald-50 dark:bg-emerald-900/20" : "")}>
                          <div className="flex-1 text-right"><p className="text-[11px] font-black dark:text-slate-100">{w.fullName}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{w.workerId}</p></div>
                          <Avatar className="h-8 w-8"><AvatarImage src={w.photoUrl} className="object-cover"/><AvatarFallback>{w.fullName?.charAt(0)}</AvatarFallback></Avatar>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          {formData.orderId && (
            <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
              <h3 className={cn("text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2", isRtl ? "flex-row" : "flex-row-reverse")}>
                <ArrowRightLeft className="w-3.5 h-3.5" /> {isRtl ? 'صرف منتجات (ربط المراحل)' : 'ISSUE PRODUCTS'}
              </h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <Button type="button" onClick={() => handleAddItem('product')} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs gap-2"><Plus className="w-3 h-3" /> {isRtl ? 'إدراج' : 'Insert'}</Button>
                <div className="w-24"><Input type="number" value={currentItem.type === 'product' ? currentItem.qty : 1} onChange={(e) => setCurrentItem({...currentItem, qty: Number(e.target.value), type: 'product'})} className="h-10 text-xs font-black tabular-nums dark:bg-slate-900 dark:border-slate-700" /></div>
                <div className="flex-1 relative" ref={productDropdownRef}>
                  <button type="button" onClick={() => setShowProductDropdown(!showProductDropdown)} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm">
                    <ChevronDown className="h-4 w-4 opacity-50" />
                    {currentItem.id && currentItem.type === 'product' ? (
                      <span className="text-[11px] font-black truncate dark:text-slate-100">{availableOrderProducts.find(p => p.id === currentItem.id)?.nameAr}</span>
                    ) : <span className="text-xs text-slate-400">-- {isRtl ? 'اختر منتج منجز سابقا' : 'Select Product'} --</span>}
                  </button>
                  {showProductDropdown && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800"><Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="بحث..." className="h-8 text-xs dark:bg-slate-900 dark:border-slate-700" /></div>
                      <ScrollArea className="h-[180px]">
                        {availableOrderProducts.filter(p => p.nameAr.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                          <button key={p.id} type="button" onClick={() => { setCurrentItem({ ...currentItem, id: p.id, type: 'product' }); setShowProductDropdown(false); }} className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-right transition-colors">
                            <div className="flex-1 overflow-hidden"><p className="text-[10px] font-black truncate dark:text-slate-100">{p.nameAr}</p><p className="text-[8px] text-emerald-600">المتاح: {p.availableQty}</p></div>
                            <Avatar className="h-7 w-7"><AvatarImage src={p.image} className="object-cover"/><AvatarFallback>P</AvatarFallback></Avatar>
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
            <h3 className={cn("text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2", isRtl ? "flex-row" : "flex-row-reverse")}>
              <Box className="w-3.5 h-3.5" /> {isRtl ? 'إضافة مواد خام من المخزن' : 'ADD RAW MATERIALS'}
            </h3>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <Button type="button" onClick={() => handleAddItem('material')} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-2"><Plus className="w-3 h-3" /> {isRtl ? 'إدراج' : 'Insert'}</Button>
              <div className="w-24"><Input type="number" value={currentItem.type === 'material' ? currentItem.qty : 1} onChange={(e) => setCurrentItem({...currentItem, qty: Number(e.target.value), type: 'material'})} className="h-10 text-xs font-black tabular-nums dark:bg-slate-900 dark:border-slate-700" /></div>
              <div className="flex-1">
                <select value={currentItem.type === 'material' ? currentItem.id : ''} onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value, type: 'material' })} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 text-right" dir={dir}>
                  <option value="">-- {isRtl ? 'اختر مادة خام' : 'Select Material'} --</option>
                  {materials?.filter(m => (m.currentQty || 0) > 0 || m.id === currentItem.id).map(m => (
                    <option key={m.id} value={m.id}>{m.nameAr} ({m.currentQty} {m.unit})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {formData.items.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table className={cn("text-right", !isRtl && "text-left")}>
                <TableHeader className="bg-slate-50 dark:bg-slate-800">
                  <TableRow className="border-b dark:border-slate-700">
                    <TableHead className={cn("px-4 py-2 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>ITEM</TableHead>
                    <TableHead className="text-center text-[9px] font-black text-slate-500 dark:text-slate-400">TYPE</TableHead>
                    <TableHead className="text-center text-[9px] font-black text-slate-500 dark:text-slate-400">QTY</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item: any, idx: number) => (
                    <TableRow key={idx} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <TableCell className={cn("px-4 py-2 font-black text-slate-800 dark:text-slate-200 text-xs", isRtl ? "text-right" : "text-left")}>{item.nameAr}</TableCell>
                      <TableCell className="px-4 py-2 text-center"><Badge variant="outline" className={cn("text-[7px] font-black uppercase", item.itemType === 'product' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20")}>{item.itemType}</Badge></TableCell>
                      <TableCell className="px-4 py-2 text-center font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums">{item.qty} <span className="text-[7px] opacity-40 uppercase">{item.unit}</span></TableCell>
                      <TableCell className="px-4 py-2">
                        <button type="button" onClick={() => removeItem(item.id, item.itemType)} className="text-rose-300 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-1.5 text-right">
            <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">VOUCHER NOTES / توجيهات السند</Label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[80px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200" dir={dir} />
          </div>

          <div className="flex gap-3 pt-6 border-t dark:border-slate-800">
            <Button type="submit" disabled={isSubmitting || formData.items.length === 0 || !formData.workerId} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <UserCheck className="w-5 h-5 me-2" />}
              {isRtl ? (editingId ? 'تحديث السند والمخزون' : 'ترحيل السند وتحديث المخزون') : 'Post Voucher'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 dark:text-slate-500 rounded-xl border-slate-200 dark:border-slate-800">إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
