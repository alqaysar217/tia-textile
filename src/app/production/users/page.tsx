'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  UserPlus, 
  FileDown, 
  Filter, 
  Check, 
  MoreVertical, 
  Settings as SettingsIcon, 
  Trash2, 
  Loader2,
  History,
  ShieldAlert,
  SortAsc,
  SortDesc,
  ArrowUpDown
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
  DropdownMenuLabel,
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useProduction } from '../ProductionContext';

// Sub-components & Constants
import { SYSTEM_MODULES } from './constants';
import { UserFormDialog } from './components/UserFormDialog';

export default function UsersPermissionsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.users?.create;
  const canEdit = isAdmin || permissions.users?.edit;
  const canDelete = isAdmin || permissions.users?.delete;

  /**
   * دالة حارس الأمان لفك تجمد الواجهة يدوياً (بروتوكول المطهر الشامل)
   * تضمن تحرير المتصفح من كافة الأقفال فور إغلاق أي نافذة
   */
  const forceUIUnlock = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
      
      const html = document.documentElement;
      html.style.pointerEvents = 'auto';
      html.style.overflow = 'auto';
      html.removeAttribute('data-scroll-locked');
    }, 200);
  }, []);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  /**
   * نظام المراقبة الذكي - يراقب حالة إغلاق النوافذ (بما فيها الضغط بالخارج)
   * ويقوم باستدعاء المطهر البرمجي فوراً لضمان عدم تجمد الشاشة
   */
  useEffect(() => {
    if (!isAddDialogOpen && !deletingUserId) {
      forceUIUnlock();
    }
  }, [isAddDialogOpen, deletingUserId, forceUIUnlock]);

  const initPermissions = () => {
    const perms: any = {};
    SYSTEM_MODULES.forEach(m => {
      perms[m.id] = { read: false, create: false, edit: false, delete: false };
    });
    return perms;
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    photoUrl: '',
    role: 'staff',
    active: true,
    permissions: initPermissions()
  });

  const usersQuery = useMemo(() => !db ? null : collection(db, 'users'), [db]);
  const { data: users, loading: usersLoading } = useCollection<any>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    // حماية حساب المطور من التعديل أو الحذف من قبل مستخدمين آخرين
    let list = users.filter(u => 
      u.status !== 'deleted' && 
      u.email !== 'alqaysarpc219@gmail.com'
    );
    
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(u => (u.fullName || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    }
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') list = list.filter(u => u.active === (statusFilter === 'active'));

    return list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [users, search, roleFilter, statusFilter]);

  const resetDialog = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingUserId(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      photoUrl: '',
      role: 'staff',
      active: true,
      permissions: initPermissions()
    });
    forceUIUnlock();
  }, [forceUIUnlock]);

  const handleEditClick = (user: any) => {
    if (!canEdit) return;
    setEditingUserId(user.id);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: user.password || '', 
      photoUrl: user.photoUrl || '',
      role: user.role || 'staff',
      active: user.active ?? true,
      permissions: user.permissions || initPermissions()
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    // إغلاق النافذة وفك قفل المتصفح فوراً قبل انتظار رد السحابة
    setIsAddDialogOpen(false); 
    forceUIUnlock();
    
    setIsSubmitting(true);

    let tempApp = null;
    try {
      let uid = editingUserId;
      if (!editingUserId) {
        // إنشاء حساب جديد في Firebase Auth باستخدام تطبيق مؤقت
        const tempAppName = `temp-auth-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        try {
          const authResult = await createUserWithEmailAndPassword(tempAuth, formData.email.trim().toLowerCase(), formData.password);
          uid = authResult.user.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            toast({ variant: "destructive", title: isRtl ? "البريد مستخدم بالفعل" : "Email exists" });
            setIsSubmitting(false); 
            return;
          }
          throw authErr;
        }
      }

      const userData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        photoUrl: formData.photoUrl,
        role: formData.role,
        active: formData.active,
        permissions: formData.permissions,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', uid!), {
        ...userData,
        createdAt: editingUserId ? (users?.find(u => u.id === uid)?.createdAt || serverTimestamp()) : serverTimestamp()
      }, { merge: true });

      toast({ title: isRtl ? "تم الحفظ بنجاح" : "User Saved" });
      resetDialog();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error Saving Profile" });
    } finally {
      if (tempApp) await deleteApp(tempApp);
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status'];
    const rows = filteredUsers.map(u => [u.fullName, u.email, u.role, u.active ? 'Active' : 'Inactive']);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `Users_Archive_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* HEADER SECTION */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'الإدارة' : 'MANAGEMENT'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'المستخدمين' : 'USERS'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isRtl ? 'إدارة الأدوار والصلاحيات' : 'Identity & Access Control'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRtl ? 'بحث باسم الموظف أو البريد...' : 'Search users...'}
                className={cn(isRtl ? 'pr-9' : 'pl-9', "h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100")}
              />
            </div>

            <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors">
              <FileDown className="w-4 h-4 text-emerald-600" />
            </Button>

            {canCreate && (
              <Button onClick={() => { setFormData({...formData, permissions: initPermissions()}); setIsAddDialogOpen(true); }} className="h-9 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none text-[11px]">
                <UserPlus className="w-4 h-4" />
                {isRtl ? 'مستخدم جديد' : 'New User'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* USERS LIST TABLE */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b dark:border-slate-700">
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المستخدم' : 'USER'}</TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'البريد الإلكتروني' : 'EMAIL'}</TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">ROLE</TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">STATUS</TableHead>
                       <TableHead className="w-20 px-6 py-4 border-b border-slate-200 dark:border-slate-700"></TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب السجلات...</TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300">لا توجد نتائج مطابقة</TableCell></TableRow>
                    ) : filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                         <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <Avatar className="h-10 w-10 rounded-lg border shadow-sm overflow-hidden">
                                  <AvatarImage src={user.photoUrl} className="object-cover" />
                                  <AvatarFallback className="bg-emerald-50 text-emerald-600 font-black text-[10px]">{user.fullName?.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{user.fullName}</span>
                            </div>
                         </TableCell>
                         <TableCell className="px-6 py-4 text-xs font-bold text-slate-500 tabular-nums">{user.email}</TableCell>
                         <TableCell className="px-6 py-4 text-center">
                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase", user.role === 'admin' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200")}>{user.role}</Badge>
                         </TableCell>
                         <TableCell className="px-6 py-4 text-center">
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border", user.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100")}>
                               <div className={cn("w-1 h-1 rounded-full", user.active ? "bg-emerald-600" : "bg-rose-600")} />
                               {user.active ? (isRtl ? 'نشط' : 'ACTIVE') : (isRtl ? 'معطل' : 'INACTIVE')}
                            </div>
                         </TableCell>
                         <TableCell className="px-6 py-4 text-center">
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56 rounded-xl shadow-xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                  {canEdit && (
                                    <DropdownMenuItem onClick={() => handleEditClick(user)} className="gap-2 font-bold py-2 cursor-pointer text-xs dark:text-slate-200"><SettingsIcon className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تعديل الصلاحيات' : 'Manage Access'}</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                                  {canDelete && (
                                    <DropdownMenuItem onClick={() => setDeletingUserId(user.id)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs focus:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'سحب الصلاحيات' : 'Revoke Access'}</DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </div>
        </div>
      </div>

      {/* MODALS */}
      <UserFormDialog 
        isOpen={isAddDialogOpen} 
        onClose={resetDialog} 
        editingId={editingUserId}
        lang={lang}
        dir={dir}
        isSubmitting={isSubmitting}
        isCompressing={isCompressing}
        formData={formData}
        setFormData={setFormData}
        onImageUpload={(e) => {
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
              const MAX_SIZE = 200;
              let w = img.width, h = img.height;
              if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
              else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
              canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, w, h);
              setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.8) }));
              setIsCompressing(false);
            };
          };
        }}
        onSave={handleSaveUser}
        forceUIUnlock={forceUIUnlock}
      />

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => { if(!open) { setDeletingUserId(null); forceUIUnlock(); } }}>
        <AlertDialogContent className="max-w-[400px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900 transition-colors duration-300">
           <div className="bg-rose-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldAlert className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'سحب صلاحيات المستخدم' : 'Revoke Account'}</AlertDialogTitle>
              <AlertDialogDescription className="text-rose-200/50 font-bold mt-2 text-xs leading-relaxed text-center">
                {isRtl ? 'هل أنت متأكد من سحب صلاحيات هذا المستخدم تماماً؟ سيتم نقله للأرشيف وتعطيل دخوله فوراً.' : 'Are you sure you want to revoke this user account?'}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={async () => { 
                if (!db || !deletingUserId || isSubmitting) return; 
                setIsSubmitting(true);
                const targetId = deletingUserId;
                setDeletingUserId(null);
                forceUIUnlock();
                try {
                  await updateDoc(doc(db, 'users', targetId), { active: false, status: 'deleted', deletedAt: serverTimestamp() }); 
                  toast({ title: isRtl ? "تم السحب بنجاح" : "Revoked" }); 
                } finally {
                  setIsSubmitting(false);
                }
              }} className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl border-none shadow-lg">تأكيد</AlertDialogAction>
              <AlertDialogCancel onClick={() => { setDeletingUserId(null); forceUIUnlock(); }} className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 font-black rounded-xl text-slate-400 border-none">إلغاء</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl transition-colors duration-300">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">TIA Data Governance Protocol • Sovereign Records Management</p>
      </div>

    </div>
  );
}
