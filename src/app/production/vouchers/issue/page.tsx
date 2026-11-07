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
  Edit2,
  CheckCircle2,
  Box,
  LayoutGrid,
  Users2,
  Building2,
  Check,
  UserCheck,
  ShieldCheck,
  UserPlus,
  ChevronDown
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MaterialIssuePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const filterOrderId = searchParams.get('orderId');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWorkerPopoverOpen, setIsWorkerPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Selection filtering state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [workerSearch, setWorkerSearch] = useState('');

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
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: materials } = useCollection<any>(materialsQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status === 'active'), [allOrders]);
  const activeDepartments = useMemo(() => (allDepartments || []).filter(d => d.status === 'active'), [allDepartments]);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter(v => {
      const order = allOrders?.find(o => o.id === v.orderId);
      const worker = allWorkers?.find(w => w.id === v.workerId);
      const s = search.toLowerCase();
      return (
        v.voucherNumber?.toLowerCase().includes(s) ||
        order?.orderNumber?.toLowerCase().includes(s) ||
        worker?.fullName?.toLowerCase().includes(s)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vouchers, allOrders, allWorkers, search]);

  const filteredWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => {
      if (w.status === 'deleted') return false;
      const matchesDept = selectedDeptId ? w.departmentId === selectedDeptId : true;
      const matchesSearch = (w.fullName || '').toLowerCase().includes(workerSearch.toLowerCase()) || 
                           (w.workerId || '').toLowerCase().includes(workerSearch.toLowerCase());
      return matchesDept && matchesSearch && (w.active !== false);
    });
  }, [allWorkers, selectedDeptId, workerSearch]);

  const selectedWorker = useMemo(() => {
    return allWorkers?.find(w => w.id === formData.workerId);
  }, [allWorkers, formData.workerId]);

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

  const editItem = (item: any) => {
    setCurrentItem({ id: item.id, qty: item.qty });
    removeItem(item.id);
    toast({ title: lang === 'ar' ? "تم نقل المادة للتعديل" : "Material moved to edit" });
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;

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
      const voucherRef = doc(collection(db, 'vouchers'));
      batch.set(voucherRef, voucherData);

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
      setSelectedDeptId('');
      setWorkerSearch('');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error saving voucher" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedDeptId('');
    setWorkerSearch('');
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', notes: '', items: [] });
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
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">{lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">{lang === 'ar' ? 'العامل' : 'WORKER'}</TableHead>
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
                const order = allOrders?.find(o => o.id === v.orderId);
                const worker = allWorkers?.find(w => w.id === v.workerId);
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><FileText className="w-3.5 h-3.5" /></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums text-right">{v.date}</TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-800 text-xs">{order?.orderNumber || '---'}</span>
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{order?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{worker?.fullName?.charAt(0)}</div>
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileInput className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'إنشاء سند صرف مواد للإنتاج' : 'New Material Issue'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Allocating raw materials to specific workers & work centers
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* 1. TOP ROW: DATE AND PRODUCTION ORDER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ السند' : 'TRANSACTION DATE'}
                </Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-12 font-bold text-xs bg-slate-50 border-slate-200" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج المستهدف' : 'PRODUCTION ORDER'}
                </Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">{lang === 'ar' ? '-- اختر أمر الإنتاج --' : '-- Select Order --'}</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
            </div>

            {/* 2. SECOND ROW: DEPT FILTER AND WORKER PICKER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'القسم (فلترة)' : 'FILTER BY DEPARTMENT'}
                </Label>
                <select 
                  value={selectedDeptId} 
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setFormData({...formData, workerId: ''}); // Clear worker when dept changes
                  }} 
                  className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">{lang === 'ar' ? 'جميع الأقسام' : 'All Departments'}</option>
                  {activeDepartments?.map(d => <option key={d.id} value={d.id}>{lang === 'ar' ? d.nameAr : d.nameEn}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Users2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'العامل المستلم' : 'RECEIVING PERSONNEL'}
                </Label>
                
                <Popover open={isWorkerPopoverOpen} onOpenChange={setIsWorkerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-12 w-full justify-between bg-slate-50 border-slate-200 px-3",
                        !formData.workerId && "text-slate-400 font-bold"
                      )}
                    >
                      {selectedWorker ? (
                        <div className="flex items-center gap-3 text-right">
                          <Avatar className="h-7 w-7 border border-slate-200">
                            <AvatarImage src={selectedWorker.photoUrl} className="object-cover" />
                            <AvatarFallback className="text-[9px] font-black bg-slate-200 text-slate-600">{selectedWorker.fullName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start overflow-hidden text-right">
                            <span className="text-[11px] font-black text-slate-900 truncate">{selectedWorker.fullName}</span>
                            <span className="text-[8px] font-bold text-slate-400 tabular-nums uppercase">{selectedWorker.workerId}</span>
                          </div>
                        </div>
                      ) : (
                        <span>{lang === 'ar' ? '-- اختر العامل --' : '-- Select Worker --'}</span>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 shadow-2xl border-slate-200 rounded-xl overflow-hidden" align="end">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-col gap-2">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          value={workerSearch}
                          onChange={(e) => setWorkerSearch(e.target.value)}
                          placeholder={lang === 'ar' ? 'بحث باسم العامل أو المعرف...' : 'Search worker...'}
                          className="h-9 pr-9 bg-white border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[280px]">
                      <div className="p-1">
                        {filteredWorkers.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا يوجد عمال يطابقون الفلتر' : 'No personnel found'}</p>
                          </div>
                        ) : filteredWorkers.map(w => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, workerId: w.id});
                              setIsWorkerPopoverOpen(false);
                            }}
                            className={cn(
                              "flex items-center gap-3 w-full p-2.5 rounded-lg transition-all border border-transparent text-right hover:bg-slate-50 mb-1",
                              formData.workerId === w.id && "bg-emerald-50 border-emerald-100"
                            )}
                          >
                            <Avatar className="h-9 w-9 border border-white shadow-sm shrink-0">
                              <AvatarImage src={w.photoUrl} className="object-cover" />
                              <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-500">{w.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden text-right">
                              <p className={cn("text-xs font-black leading-tight", formData.workerId === w.id ? "text-emerald-700" : "text-slate-800")}>{w.fullName}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest tabular-nums">{w.workerId}</p>
                            </div>
                            {formData.workerId === w.id && <Check className="w-4 h-4 text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 3. ITEM SELECTION BOX */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إضافة أصناف الخيوط والمواد من المخزن' : 'ADD RAW MATERIALS FROM INVENTORY'}
              </h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'الصنف المتوفر' : 'ITEM'}</Label>
                  <select 
                    value={currentItem.id} 
                    onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 text-white border border-slate-700 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">{lang === 'ar' ? '-- اختر مادة من المخزن --' : '-- Select Material --'}</option>
                    {materials?.filter(m => (m.currentQty || 0) > 0).map(m => (
                      <option key={m.id} value={m.id} className="text-white">{m.nameAr} ({m.currentQty} {m.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-400">{lang === 'ar' ? 'الكمية' : 'QTY'}</Label>
                  <Input 
                    type="number" 
                    value={currentItem.qty} 
                    onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })}
                    className="h-10 font-bold text-xs bg-slate-800 text-white border border-slate-700 tabular-nums" 
                  />
                </div>
                <Button type="button" onClick={handleAddItem} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-black text-xs gap-2 border-none shadow-lg">
                  <Plus className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إدراج في السند' : 'Insert to List'}
                </Button>
              </div>
            </div>

            {/* 4. VOUCHER ITEMS TABLE */}
            {formData.items.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table className="text-right">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-right">{lang === 'ar' ? 'المادة' : 'MATERIAL'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الكمية المصروفة' : 'ISSUED QTY'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الوحدة' : 'UNIT'}</TableHead>
                      <TableHead className="px-4 py-2 w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 bg-white group/row">
                        <TableCell className="px-4 py-2 font-black text-slate-800 text-xs text-right">{item.nameAr}</TableCell>
                        <TableCell className="px-4 py-2 text-center font-black text-emerald-700 text-sm tabular-nums">{item.qty}</TableCell>
                        <TableCell className="px-4 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">{item.unit}</TableCell>
                        <TableCell className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editItem(item)} className="h-7 w-7 text-emerald-300 hover:text-emerald-600 hover:bg-emerald-50" title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50" title={lang === 'ar' ? 'حذف' : 'Remove'}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات وتوجيهات السند' : 'VOUCHER NOTES & INSTRUCTIONS'}</Label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white focus:border-emerald-500 transition-all" 
                placeholder={lang === 'ar' ? 'اكتب أي ملاحظات تتعلق بصرف هذه المواد للعامل...' : 'Enter any specific instructions for this material issue...'} 
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.items.length === 0 || !formData.workerId} className="flex-1 h-14 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-base border-none shadow-xl shadow-emerald-900/10">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <UserCheck className="w-5 h-5 me-2" />}
                {lang === 'ar' ? 'ترحيل السند وتحديث المخزون' : 'Post Voucher & Update WMS'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-2.5 bg-slate-900 text-white/50 flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' 
            ? 'بروتوكول الأمان: ترحيل السند يؤدي إلى تقييد المواد فوراً كـ "عهدة" على العامل وتكاليف على أمر الإنتاج.' 
            : 'Security Protocol: Posting instantly assigns materials as worker liability and applies costs to the manufacturing order.'}
        </p>
      </div>

    </div>
  );
}
