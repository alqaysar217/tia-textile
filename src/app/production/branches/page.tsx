'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Save, 
  ChevronRight, 
  Loader2, 
  UploadCloud, 
  RefreshCcw, 
  Phone, 
  ImageIcon,
  History,
  ShieldCheck,
  Languages,
  Building2,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useProduction } from '../ProductionContext';

export default function BranchesManagementPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const isRtl = lang === 'ar';

  // استيراد الصلاحيات من المحرك المركزي
  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.branches?.create;
  const canEdit = isAdmin || permissions.branches?.edit;
  const canDelete = isAdmin || permissions.branches?.delete;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState({
    nameAr: '',
    addressAr: '',
    phoneNumber: '',
    photoUrl: '',
    status: 'active'
  });

  const branchesQuery = useMemo(() => !db ? null : collection(db, 'branches'), [db]);
  const { data: branches, loading } = useCollection<any>(branchesQuery);

  const filtered = useMemo(() => {
    if (!branches) return [];
    let list = branches.filter(b => b.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(b => b.nameAr?.includes(s) || b.addressAr?.includes(s));
    }
    return list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || ''));
  }, [branches, search]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.8) }));
        setIsCompressing(false);
      };
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    if (editingId && !canEdit) { toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتعديل" : "Access Denied" }); return; }
    if (!editingId && !canCreate) { toast({ variant: "destructive", title: isRtl ? "غير مسموح بالإضافة" : "Access Denied" }); return; }

    setIsSubmitting(true);
    try {
      const data = { ...formData, updatedAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, 'branches', editingId), data);
        toast({ title: isRtl ? "تم تحديث بيانات الفرع" : "Branch Updated" });
      } else {
        await addDoc(collection(db, 'branches'), { ...data, createdAt: serverTimestamp() });
        toast({ title: isRtl ? "تم إضافة الفرع بنجاح" : "Branch Added" });
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setFormData({ nameAr: '', addressAr: '', phoneNumber: '', photoUrl: '', status: 'active' });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* HEADER SECTION */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'الإدارة' : 'MANAGEMENT'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'فروع الجمعية' : 'BRANCHES'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isRtl ? 'إدارة المواقع ونقاط البيع' : 'Facility & Store Locations'}
              </h1>
            </div>
          </div>
          
          {canCreate && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 border-none">
              <Plus className="w-4 h-4" /> {isRtl ? 'إضافة فرع جديد' : 'New Branch'}
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
           <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={isRtl ? 'بحث باسم الفرع أو العنوان...' : 'Search branches...'} 
                className={cn("h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100", isRtl ? "pr-10" : "pl-10")} 
              />
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center font-bold text-slate-400 animate-pulse">جاري جلب الفروع...</div>
          ) : filtered.length === 0 ? (
             <div className="col-span-full py-20 text-center font-bold text-slate-300">لا توجد فروع مسجلة</div>
          ) : filtered.map(branch => (
            <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
               <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {branch.photoUrl ? (
                    <img src={branch.photoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={branch.nameAr} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><ImageIcon className="w-12 h-12" /></div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {canEdit && (
                      <Button variant="secondary" size="icon" onClick={() => { setEditingId(branch.id); setFormData({ ...branch }); setIsAddDialogOpen(true); }} className="h-8 w-8 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-lg"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /></Button>
                    )}
                    {canDelete && (
                      <Button variant="destructive" size="icon" onClick={() => setDeletingId(branch.id)} className="h-8 w-8 shadow-lg rounded-lg"><Trash2 className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
               </div>
               <div className="p-5 space-y-4">
                  <div className="space-y-1">
                     <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        {branch.nameAr}
                     </h3>
                     <div className="flex items-start gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase">
                        <MapPin className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span className="flex-1">{branch.addressAr}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                     <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"><PhoneCall className="w-3.5 h-3.5" /></div>
                        <span className="text-xs font-black tabular-nums dark:text-slate-200">{branch.phoneNumber}</span>
                     </div>
                     <Badge variant="outline" className="bg-emerald-50/50 dark:bg-emerald-900/20 text-[9px] font-black uppercase text-emerald-600 border-none">فرع نشط</Badge>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white text-right">
            <DialogHeader className={cn("text-right", !isRtl && "text-left")}>
              <DialogTitle className="text-xl font-black flex items-center gap-3 justify-start">
                <MapPin className="w-5 h-5 text-emerald-300" />
                {editingId ? 'تعديل بيانات الفرع' : 'تسجيل فرع جديد'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5 bg-white dark:bg-slate-900">
             <div className="flex flex-col items-center gap-3">
                <div onClick={() => !isCompressing && fileInputRef.current?.click()} className="w-32 h-32 rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer group relative overflow-hidden transition-all">
                   {formData.photoUrl ? (
                     <img src={formData.photoUrl} className="w-full h-full object-cover" />
                   ) : (
                     <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-emerald-500" />
                   )}
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCcw className="w-5 h-5 text-white" /></div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Label className="text-[10px] font-black uppercase text-slate-400">BRANCH PHOTO</Label>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5 text-right">
                   <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start">
                     <Languages className="w-3.5 h-3.5 text-emerald-600" />
                     اسم الفرع (باللغة العربية)
                   </Label>
                   <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-11 font-bold text-xs dark:bg-slate-800 dark:text-white" dir="rtl" placeholder="مثال: معرض عتق الرئيسي" required />
                </div>
                
                <div className="space-y-1.5 text-right">
                   <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start">
                     <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                     العنوان التفصيلي
                   </Label>
                   <Input value={formData.addressAr} onChange={(e) => setFormData({...formData, addressAr: e.target.value})} className="h-11 font-bold text-xs dark:bg-slate-800 dark:text-white" dir="rtl" placeholder="مثال: مدينة عتق - الشارع العام" required />
                </div>

                <div className="space-y-1.5 text-right">
                   <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start">
                     <Phone className="w-3.5 h-3.5 text-emerald-600" />
                     رقم هاتف الفرع / واتساب
                   </Label>
                   <Input value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="h-11 font-bold text-xs tabular-nums dark:bg-slate-800 dark:text-white" dir="ltr" placeholder="7XXXXXXXX" required />
                </div>
             </div>

             <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-12 premium-gradient text-white font-black rounded-xl shadow-lg transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                  {isRtl ? 'حفظ بيانات الفرع' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400 dark:text-slate-500 rounded-xl">إلغاء</Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
           <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><MapPin className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
                <History className="w-8 h-8 text-red-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'أرشفة موقع الفرع' : 'Archive Location'}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
                 {isRtl ? 'هل أنت متأكد من نقل هذا الفرع للأرشيف؟ سيختفي الموقع من كافة التقارير النشطة والموقع العام.' : 'This location will be hidden from the public website.'}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={async () => { if (!db || !deletingId) return; await updateDoc(doc(db, 'branches', deletingId), { status: 'deleted', updatedAt: serverTimestamp() }); setDeletingId(null); toast({ title: "Archived" }); }} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl border-none shadow-lg">تأكيد الأرشفة</AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 font-black rounded-xl">تراجع</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول إدارة الفروع: أي تعديل على بيانات الفروع ينعكس فوراً على خريطة المواقع في الموقع الإلكتروني العام.' 
             : 'Location Management Protocol: Branch updates are instantly pushed to the public site map.'}
         </p>
      </div>

    </div>
  );
}
