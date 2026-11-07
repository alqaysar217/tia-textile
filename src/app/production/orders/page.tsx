
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Factory, 
  PlayCircle, 
  Timer, 
  CheckCircle2, 
  FileText,
  AlertCircle,
  Filter,
  ArrowRight,
  TrendingUp,
  Boxes,
  Users,
  Layers,
  ArrowUpRight,
  Calendar,
  Save,
  Loader2,
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    targetQty: 300,
    priority: 'normal',
    notes: ''
  });

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);

  const { data: products } = useCollection<any>(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: departments } = useCollection<any>(deptsQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const product = products?.find(p => p.id === o.productId);
      const name = product?.nameAr || '';
      const orderNo = o.orderNumber || '';
      return name.includes(search) || orderNo.includes(search);
    });
  }, [orders, products, search]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const orderData = {
      orderNumber,
      productId: formData.productId,
      targetQty: Number(formData.targetQty),
      completedQty: 0,
      status: 'active',
      priority: formData.priority,
      notes: formData.notes,
      startDate: new Date().toISOString().split('T')[0],
      currentStageId: departments?.[0]?.id || '', // Default to first stage
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'productionOrders'), orderData);
      toast({ title: lang === 'ar' ? "تم إنشاء أمر الإنتاج" : "Order Created" });
      setIsAddDialogOpen(false);
      setFormData({ productId: '', targetQty: 300, priority: 'normal', notes: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Manufacturing'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'أوامر التشغيل' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تتبع أوامر الإنتاج والمراحل' : 'Production & Stage Tracking'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إنشاء أمر جديد' : 'Open New Order'}
            </Button>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'أوامر نشطة' : 'Active Orders'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">{orders?.length || 0}</span>
              <PlayCircle className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'إجمالي الـ WIP' : 'Total WIP'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">---</span>
              <Timer className="w-4 h-4 text-amber-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'تم استلامه اليوم' : 'Daily Output'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-emerald-600 tabular-nums">0</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'تنبيهات تأخير' : 'Delays'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-rose-600 tabular-nums">0</span>
              <AlertCircle className="w-4 h-4 text-rose-500 mb-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-6 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 font-bold">{lang === 'ar' ? 'جاري جلب الأوامر...' : 'Loading Orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Boxes className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400">{lang === 'ar' ? 'لا توجد أوامر إنتاج حالياً' : 'No Production Orders'}</h3>
            <p className="text-slate-300 text-sm mt-1">{lang === 'ar' ? 'ابدأ بإنشاء أول أمر لتتبع مراحل العمل.' : 'Create your first order to start tracking stages.'}</p>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          const stage = departments?.find(d => d.id === order.currentStageId);
          const progress = Math.round((order.completedQty / order.targetQty) * 100) || 0;

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* Order Identity */}
                  <div className="flex-none w-full lg:w-64 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded tabular-nums tracking-wider uppercase">
                        {order.orderNumber}
                      </span>
                      <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", order.priority === 'high' ? "bg-rose-500" : "bg-emerald-500")} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {product?.nameAr || '---'}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span className="tabular-nums">{order.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span>{order.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Visualizer */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          {lang === 'ar' ? 'المرحلة النشطة حالياً' : 'Active Stage'}
                        </p>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black border border-emerald-100 shadow-sm">
                          {stage?.nameAr || (lang === 'ar' ? 'بانتظار البدء' : 'Pending Start')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الإنجاز النهائي' : 'Final Completion'}</p>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xl font-black text-slate-900 tabular-nums">{progress}%</span>
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-2">
                      <Progress value={progress} className="h-2.5 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'Target'}</p>
                        <p className="text-sm font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-[9px] font-black text-amber-700/60 uppercase">{lang === 'ar' ? 'تم استلامه' : 'Received'}</p>
                        <p className="text-sm font-black text-amber-700 tabular-nums">{order.completedQty}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-700/60 uppercase">{lang === 'ar' ? 'المتبقي' : 'Remaining'}</p>
                        <p className="text-sm font-black text-emerald-700 tabular-nums">{order.targetQty - order.completedQty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex-none flex flex-row lg:flex-col gap-2 justify-center">
                    <Button variant="outline" className="flex-1 lg:w-40 h-10 rounded-xl font-black text-xs gap-2 border-slate-200">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      {lang === 'ar' ? 'سندات الأمر' : 'Order Vouchers'}
                    </Button>
                    <Button className="flex-1 lg:w-40 h-10 premium-gradient rounded-xl font-black text-xs gap-2 border-none shadow-md">
                      {lang === 'ar' ? 'إدارة المرحلة' : 'Process Stage'}
                      <ArrowRight className={cn("w-3.5 h-3.5", dir === 'rtl' && "rotate-180")} />
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW ORDER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Workflow className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Production Order'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Initiating a new manufacturing batch</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'اختر المنتج من الكتالوج' : 'SELECT PRODUCT'}</Label>
              <select 
                value={formData.productId} 
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر المعوز --' : '-- Select Product --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input 
                  type="number" 
                  value={formData.targetQty} 
                  onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})}
                  className="h-11 rounded-xl bg-slate-50 font-bold tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                >
                  <option value="low">{lang === 'ar' ? 'عادية' : 'Low'}</option>
                  <option value="normal">{lang === 'ar' ? 'متوسطة' : 'Normal'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة جداً' : 'High'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات إضافية' : 'NOTES'}</Label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none"
                placeholder={lang === 'ar' ? 'أي تعليمات خاصة لهذا الأمر...' : 'Special instructions...'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'حفظ والبدء' : 'Create & Start'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="px-6 h-12 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SYSTEM NOTES */}
      <div className="flex-none p-4 bg-slate-900 text-white/50 flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><AlertCircle className="w-4 h-4" /></div>
        <p className="text-[10px] font-medium leading-tight">
          {lang === 'ar' 
            ? 'تنبيه: يتم تحديث تكلفة القطعة آلياً عند إتمام كل مرحلة بناءً على المواد السالبة وأجور العمال المسجلة في السندات.' 
            : 'Note: Unit cost is recalculated automatically upon stage completion based on issued materials and labor wages.'}
        </p>
      </div>

    </div>
  );
}
