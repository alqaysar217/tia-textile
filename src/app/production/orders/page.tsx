
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  TrendingUp,
  Boxes,
  Calendar,
  Save,
  Loader2,
  Workflow,
  ShoppingBag,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  History,
  Type,
  Tag,
  Activity,
  Gauge,
  Target,
  Layers,
  ArrowUpRight,
  FileInput,
  ShieldCheck,
  Users2,
  Building2,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/components/LanguageProvider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLogisticsDialogOpen, setIsLogisticsDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [managingOrder, setManagingOrder] = useState<any | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    productId: '',
    targetQty: 300,
    priority: 'normal',
    notes: ''
  });

  // Logistics Form State
  const [logisticsData, setLogisticsData] = useState({
    currentStageId: '',
    notes: ''
  });

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: departments } = useCollection<any>(deptsQuery);
  const { data: workers } = useCollection<any>(workersQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const activeOrders = orders.filter(o => o.status !== 'deleted');
    return activeOrders.filter(o => {
      const product = products?.find(p => p.id === o.productId);
      const productName = product?.nameAr || '';
      const orderNo = o.orderNumber || '';
      const orderTitle = o.title || '';
      const s = search.toLowerCase();
      return productName.includes(s) || orderNo.toLowerCase().includes(s) || orderTitle.toLowerCase().includes(s);
    });
  }, [orders, products, search]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingOrderId(null);
    setFormData({ title: '', productId: '', targetQty: 300, priority: 'normal', notes: '' });
  }, []);

  const resetLogistics = useCallback(() => {
    setIsLogisticsDialogOpen(false);
    setManagingOrder(null);
    setLogisticsData({ currentStageId: '', notes: '' });
  }, []);

  const handleEditClick = (order: any) => {
    setEditingOrderId(order.id);
    setFormData({
      title: order.title || '',
      productId: order.productId || '',
      targetQty: order.targetQty || 0,
      priority: order.priority || 'normal',
      notes: order.notes || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleManageTeams = (order: any) => {
    setManagingOrder(order);
    setLogisticsData({
      currentStageId: order.currentStageId || '',
      notes: ''
    });
    setIsLogisticsDialogOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    const orderData = {
      title: formData.title,
      productId: formData.productId,
      targetQty: Number(formData.targetQty),
      priority: formData.priority,
      notes: formData.notes,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingOrderId) {
        await updateDoc(doc(db, 'productionOrders', editingOrderId), orderData);
        toast({ title: lang === 'ar' ? "تم تحديث الأمر" : "Order Updated" });
      } else {
        const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder = {
          ...orderData,
          orderNumber,
          completedQty: 0,
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          currentStageId: departments?.find(d => d.status === 'active')?.id || '',
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'productionOrders'), newOrder);
        toast({ title: lang === 'ar' ? "تم إنشاء أمر الإنتاج" : "Order Created" });
      }
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !managingOrder || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'productionOrders', managingOrder.id), {
        currentStageId: logisticsData.currentStageId,
        updatedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم تحديث مرحلة التشغيل" : "Logistics Updated" });
      resetLogistics();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!db || !deletingOrder) return;
    
    if (deletingOrder.completedQty > 0) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "فشل الحذف" : "Deletion Failed",
        description: lang === 'ar' ? "لا يمكن حذف أمر إنتاج يحتوي على كميات مستلمة." : "Cannot delete order with completed items."
      });
      setDeletingOrder(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'productionOrders', deletingOrder.id), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم نقل الأمر للأرشيف" : "Order Archived" });
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingOrder(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <Workflow className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'وحدة العمليات' : 'Operations'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تتبع مسارات التصنيع' : 'WIP Path Tracking'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث سريع...' : 'Quick search...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'أمر جديد' : 'New Order'}
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-3 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 font-bold">{lang === 'ar' ? 'جاري سحب الأوامر...' : 'Fetching orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Boxes className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-400">{lang === 'ar' ? 'لا توجد أوامر نشطة' : 'No active orders'}</h3>
            <p className="text-slate-300 text-sm mt-1">{lang === 'ar' ? 'ابدأ بإضافة أول أمر تشغيل من الزر أعلاه.' : 'Add your first order to begin.'}</p>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          const stage = departments?.find(d => d.id === order.currentStageId);
          
          const stageSupervisor = workers?.find(w => w.departmentId === order.currentStageId && w.isSupervisor && w.active);
          
          const progress = Math.round((order.completedQty / order.targetQty) * 100) || 0;
          const priorityColor = order.priority === 'high' ? 'bg-rose-500' : order.priority === 'normal' ? 'bg-emerald-500' : 'bg-slate-400';

          return (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-300 overflow-hidden group">
              <div className="flex flex-col lg:flex-row items-stretch">
                
                {/* 1. IDENTITY & STATUS BAR */}
                <div className="w-full lg:w-1/4 p-3 flex flex-col justify-between relative border-l border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded border border-slate-200 tabular-nums uppercase tracking-tight">
                        {order.orderNumber}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-100"><MoreVertical className="w-3 h-3 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-lg shadow-xl">
                          <DropdownMenuItem onClick={() => handleEditClick(order)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs">
                            <Edit2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/production/vouchers/issue?orderId=${order.id}`)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs">
                            <FileInput className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'صرف مواد' : 'Issue Material'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingOrder(order)} className="gap-2 font-bold py-1.5 text-rose-600 cursor-pointer text-xs">
                            <Trash2 className="w-3 h-3" /> {lang === 'ar' ? 'أرشفة الأمر' : 'Archive Order'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {order.title || (product?.nameAr || '---')}
                      </h3>
                      <div className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                        <Tag className="w-2 h-2" />
                        {product?.nameAr || '---'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-1.5">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tabular-nums">
                      <Calendar className="w-2.5 h-2.5" />
                      {order.startDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", priorityColor)} />
                      <span className="text-[8px] font-black text-slate-400 uppercase">{order.priority}</span>
                    </div>
                  </div>
                </div>

                {/* 2. PROGRESS & METRICS */}
                <div className="flex-1 p-3 space-y-3 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-emerald-600" />
                        {lang === 'ar' ? 'المرحلة والمسؤولية' : 'PHASE & ACCOUNTABILITY'}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-[11px] font-black text-slate-800">
                          {stage?.nameAr || (lang === 'ar' ? 'بانتظار البدء' : 'PENDING')}
                        </p>
                        {stageSupervisor && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md shadow-sm animate-in fade-in zoom-in-95">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span className="text-[9px] font-black text-slate-600">{lang === 'ar' ? 'بإشراف:' : 'Lead:'} {stageSupervisor.fullName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-base font-black text-slate-900 tabular-nums">{progress}%</span>
                        <div className="p-0.5 bg-emerald-50 rounded text-emerald-600"><TrendingUp className="w-2.5 h-2.5" /></div>
                      </div>
                    </div>
                  </div>

                  <Progress value={progress} className="h-1.5 bg-slate-200/50" />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5 bg-white/40 p-1.5 rounded-lg border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</p>
                      <p className="text-[11px] font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                    </div>
                    <div className="space-y-0.5 bg-white/40 p-1.5 rounded-lg border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'تم الاستلام' : 'RECEIVED'}</p>
                      <p className="text-[11px] font-black text-amber-600 tabular-nums">{order.completedQty}</p>
                    </div>
                    <div className="space-y-0.5 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/50">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">{lang === 'ar' ? 'قيد العمل' : 'REMAINING'}</p>
                      <p className="text-[11px] font-black text-emerald-700 tabular-nums">{order.targetQty - order.completedQty}</p>
                    </div>
                  </div>
                </div>

                {/* 3. QUICK ACTIONS HUB */}
                <div className="w-full lg:w-36 p-2.5 flex flex-row lg:flex-col gap-2 border-r border-slate-100 bg-white items-center justify-center">
                  <Button 
                    onClick={() => router.push(`/production/vouchers/issue?orderId=${order.id}`)}
                    variant="outline" 
                    className="flex-1 lg:w-full h-9 rounded-lg text-[9px] font-black gap-1.5 border-slate-200 hover:bg-slate-50 transition-all uppercase"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'ar' ? 'سندات الأمر' : 'Vouchers'}
                  </Button>
                  <Button 
                    onClick={() => handleManageTeams(order)}
                    className="flex-1 lg:w-full h-9 premium-gradient rounded-lg text-[9px] font-black gap-1.5 border-none shadow-md hover:opacity-90 uppercase"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'إدارة الفرق' : 'Manage Teams'}
                  </Button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* NEW/EDIT ORDER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Workflow className="w-5 h-5 text-emerald-300" />
                {editingOrderId ? (lang === 'ar' ? 'تعديل أمر الإنتاج' : 'Update Order') : (lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Master Batch')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Initiating manufacturing cycle & target metrics
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Type className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}
              </Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={lang === 'ar' ? 'مثال: طلبية معرض عتق - دفعة العيد' : 'e.g. Eid Batch - Main Branch'}
                className="h-11 rounded-lg bg-slate-50 font-bold border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT SELECTION'}
              </Label>
              <select 
                value={formData.productId} 
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر المعوز --' : '-- Select Item --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
              {products?.length === 0 && !productsLoading && (
                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {lang === 'ar' ? 'الكتالوج فارغ. يرجى إضافة منتجات أولاً.' : 'Catalog is empty. Please add products first.'}
                  <Link href="/production/products" className="underline ms-1">{lang === 'ar' ? 'اذهب للكتالوج' : 'Go to Catalog'}</Link>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input 
                  type="number" 
                  value={formData.targetQty} 
                  onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})}
                  className="h-11 rounded-lg bg-slate-50 font-bold tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                >
                  <option value="low">{lang === 'ar' ? 'عادية' : 'Normal'}</option>
                  <option value="normal">{lang === 'ar' ? 'متوسطة' : 'Priority'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <FileText className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'ملاحظات إضافية' : 'ADDITIONAL NOTES'}
              </Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={lang === 'ar' ? 'أدخل أي تعليمات خاصة هنا...' : 'Enter any special instructions...'}
                className="min-h-[80px] rounded-lg bg-slate-50 font-medium border-slate-200 resize-none text-xs"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || products?.length === 0} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-lg font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (editingOrderId ? 'تحديث' : 'بدء الإنتاج') : (editingOrderId ? 'Update' : 'Launch Batch')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400 rounded-lg">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE TEAMS & LOGISTICS DIALOG */}
      <Dialog open={isLogisticsDialogOpen} onOpenChange={(open) => !open && resetLogistics()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Users2 className="w-24 h-24" /></div>
            <DialogHeader className="text-right rtl:text-right ltr:text-left relative z-10">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Building2 className="w-5 h-5 text-emerald-400" />
                {lang === 'ar' ? 'إدارة الفرق واللوجستيات' : 'Order Logistics & Teams'}
              </DialogTitle>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Routing batches through production work centers
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleUpdateLogistics} className="p-6 space-y-6 bg-white">
            {managingOrder && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Activity className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الحالة الحالية' : 'CURRENT STATUS'}</p>
                    <p className="text-sm font-black text-slate-800">
                      {departments?.find(d => d.id === managingOrder.currentStageId)?.nameAr || (lang === 'ar' ? 'غير محدد' : 'N/A')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-50 text-emerald-700 font-black text-[10px]">{managingOrder.orderNumber}</Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Layers className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'تغيير مرحلة الإنتاج (Work Center)' : 'MOVE TO WORK CENTER'}
                </Label>
                <select 
                  value={logisticsData.currentStageId} 
                  onChange={(e) => setLogisticsData({...logisticsData, currentStageId: e.target.value})}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                >
                  <option value="">{lang === 'ar' ? '-- اختر القسم المستلم --' : '-- Select Stage --'}</option>
                  {departments?.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.id}>{d.nameAr}</option>
                  ))}
                </select>
                <p className="text-[9px] font-bold text-slate-400 italic">
                  {lang === 'ar' ? '* اختيار القسم سيقوم تلقائياً بتحديث المشرف المسؤول عن الطلبية.' : '* Selecting a stage updates the responsible supervisor.'}
                </p>
              </div>

              {/* RELEVANT SUPERVISOR INFO */}
              {logisticsData.currentStageId && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{lang === 'ar' ? 'المشرف المسؤول في هذا القسم' : 'STAGE LEAD'}</p>
                    <p className="text-xs font-bold text-emerald-700">
                      {workers?.find(w => w.departmentId === logisticsData.currentStageId && w.isSupervisor && w.active)?.fullName || (lang === 'ar' ? 'لم يعين مشرف لهذا القسم' : 'No lead assigned')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !logisticsData.currentStageId} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-sm border-none shadow-xl shadow-emerald-900/10 gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {lang === 'ar' ? 'تأكيد النقل والمسؤولية' : 'Commit Transfer'}
              </Button>
              <Button type="button" variant="outline" onClick={resetLogistics} className="px-6 h-12 font-black text-slate-400 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ORDER ALERT DIALOG */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة أمر الإنتاج' : 'Archive Order'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'سيتم نقل هذا الأمر للأرشيف. لا يمكن الحذف في حال وجود كميات منجزة.' 
                : 'Order will be moved to archive. Deletion is blocked if production started.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeleteOrder} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {lang === 'ar' ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingOrder(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* SYSTEM NOTE - FOOTER */}
      <div className="flex-none p-2 bg-slate-900 text-white/40 flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><AlertCircle className="w-2.5 h-2.5" /></div>
        <p className="text-[9px] font-bold">
          {lang === 'ar' 
            ? 'بروتوكول الرقابة: يتم ربط كل مرحلة بالمشرف المسؤول لضمان جودة المخرجات والالتزام بالجدول الزمني.' 
            : 'Audit Protocol: Each stage is linked to a responsible supervisor for quality and timeline assurance.'}
        </p>
      </div>

    </div>
  );
}

// Add simple Refresh icon component as it might not be imported correctly from lucide-react if the version varies
function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
