'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  UserCheck, 
  ChevronRight, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Mail, 
  Shield, 
  Check, 
  Save, 
  Loader2, 
  Key,
  Briefcase,
  UploadCloud,
  RefreshCcw,
  User as UserIcon,
  Users,
  LayoutDashboard,
  Workflow,
  ShoppingBag,
  Layers,
  FileInput,
  FileOutput,
  HandCoins,
  Receipt,
  FileBarChart,
  Settings as SettingsIcon,
  AlertCircle
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useCollection } from '@/firebase';
import { collection, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const SYSTEM_MODULES = [
  { id: 'dashboard', labelAr: 'لوحة التحكم والإحصائيات', labelEn: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'orders', labelAr: 'أوامر الإنتاج (WIP)', labelEn: 'Production Orders', icon: <Workflow className="w-3.5 h-3.5" /> },
  { id: 'products', labelAr: 'كتالوج المنتجات', labelEn: 'Products Catalog', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: 'materials', labelAr: 'المخزون والمواد الخام', labelEn: 'Inventory', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'vouchers_issue', labelAr: 'سندات صرف المواد', labelEn: 'Material Issue', icon: <FileInput className="w-3.5 h-3.5" /> },
  { id: 'vouchers_receipt', labelAr: 'سندات استلام الإنتاج', labelEn: 'Production Receipts', icon: <FileOutput className="w-3.5 h-3.5" /> },
  { id: 'vouchers_return', labelAr: 'سندات المرتجع المخزني', labelEn: 'Material Returns', icon: <RefreshCcw className="w-3.5 h-3.5" /> },
  { id: 'wages', labelAr: 'صرف الأجور والمالية', labelEn: 'Wages', icon: <HandCoins className="w-3.5 h-3.5" /> },
  { id: 'overhead', labelAr: 'المصاريف التشغيلية', labelEn: 'Overhead Costs', icon: <Receipt className="w-3.5 h-3.5" /> },
  { id: 'workers', labelAr: 'إدارة العمال والأقسام', labelEn: 'Workforce', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'reports', labelAr: 'التقارير التحليلية', labelEn: 'Reports', icon: <FileBarChart className="w-3.5 h-3.5" /> },
  { id: 'settings', labelAr: 'إعدادات النظام', labelEn: 'Settings', icon: <SettingsIcon className="w-3.5 h-3.5" /> },
  { id: 'trash', labelAr: 'سلة المهملات والأرشفة', labelEn: 'Trash', icon: <Trash2 className="w-3.5 h-3.5" /> },
];

export default function UsersPermissionsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'ar';

  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

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
    permissions: initPermissions() as Record<string, { read: boolean; create: boolean; edit: boolean; delete: boolean }>
  });

  const usersQuery = useMemo(() => !db ? null : collection(db, 'users'), [db]);
  const { data: users, loading: usersLoading } = useCollection<any>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [users, search]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingUserId(null);
    setIsSubmitting(false);
    setIsCompressing(false);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      photoUrl: '',
      role: 'staff',
      active: true,
      permissions: initPermissions()
    });
  }, []);

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
        const MAX_SIZE = 200;
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.7) }));
        setIsCompressing(false);
      };
    };
  };

  const handleEditClick = (user: any) => {
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

  const handleTogglePermission = (moduleId: string, type: 'read' | 'create' | 'edit' | 'delete') => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [type]: !prev.permissions[moduleId][type]
        }
      }
    }));
  };

  const handleToggleRow = (moduleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: { read: checked, create: checked, edit: checked, delete: checked }
      }
    }));
  };

  const handleToggleColumn = (type: 'read' | 'create' | 'edit' | 'delete', checked: boolean) => {
    const newPerms = { ...formData.permissions };
    SYSTEM_MODULES.forEach(m => {
      newPerms[m.id] = { ...newPerms[m.id], [type]: checked };
    });
    setFormData(prev => ({ ...prev, permissions: newPerms }));
  };

  const handleToggleAll = (checked: boolean) => {
    const newPerms: any = {};
    SYSTEM_MODULES.forEach(m => {
      newPerms[m.id] = { read: checked, create: checked, edit: checked, delete: checked };
    });
    setFormData(prev => ({ ...prev, permissions: newPerms }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    setIsSubmitting(true);
    let tempApp = null;
    try {
      let uid = editingUserId;
      
      // CRITICAL FIX: Trim inputs to avoid invalid-credential desync
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPassword = formData.password.trim();

      if (!editingUserId) {
        // PROVISION AUTH ACCOUNT (Primary session protection)
        const tempAppName = `temp-auth-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        
        try {
          const authResult = await createUserWithEmailAndPassword(tempAuth, cleanEmail, cleanPassword);
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

      if (!uid) throw new Error("Could not determine UID");

      const userData = {
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        password: cleanPassword, // Stored for admin reference only, Auth handles security
        photoUrl: formData.photoUrl,
        role: formData.role,
        active: formData.active,
        permissions: formData.permissions,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: editingUserId ? (users?.find(u => u.id === uid)?.createdAt || serverTimestamp()) : serverTimestamp()
      }, { merge: true });

      toast({ title: isRtl ? "تم تفعيل الحساب والصلاحيات بنجاح" : "Success" });
      resetForm();
    } catch (err: any) {
      console.error("User Save Error:", err);
      toast({ variant: "destructive", title: isRtl ? "خطأ في النظام" : "Error" });
    } finally {
      if (tempApp) await deleteApp(tempApp);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* ERP HUB - HEADER */}
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
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'المستخدمين والصلاحيات' : 'ACCESS CONTROL'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isRtl ? 'إدارة الأدوار وصلاحيات الوصول' : 'Identity & Access Management'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRtl ? 'بحث باسم المستخدم...' : 'Search users...'}
                className={cn(dir === 'rtl' ? 'pr-10' : 'pl-10', "h-10 w-64 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100")}
              />
            </div>
            <Button onClick={() => { setFormData({...formData, permissions: initPermissions()}); setIsAddDialogOpen(true); }} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <UserPlus className="w-4 h-4" />
              {isRtl ? 'حساب جديد' : 'New Account'}
            </Button>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b dark:border-slate-700">
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المستخدم' : 'USER'}</TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'البريد الإلكتروني' : 'EMAIL'}</TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center")}>{isRtl ? 'الدور' : 'ROLE'}</TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center")}>{isRtl ? 'الحالة' : 'STATUS'}</TableHead>
                       <TableHead className="w-20 px-6 py-4 border-b border-slate-200 dark:border-slate-700"></TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold">{isRtl ? 'لا يوجد مستخدمين' : 'No users found'}</TableCell></TableRow>
                    ) : filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                         <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <Avatar className="h-10 w-10 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm">
                                  <AvatarImage src={user.photoUrl} className="object-cover" />
                                  <AvatarFallback className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">{user.fullName?.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{user.fullName}</span>
                            </div>
                         </TableCell>
                         <TableCell className="px-6 py-4 text-xs font-bold text-slate-500 tabular-nums">{user.email}</TableCell>
                         <TableCell className="px-6 py-4 text-center">
                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase", user.role === 'admin' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : user.role === 'manager' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200")}>{user.role}</Badge>
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
                               <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56 rounded-xl shadow-xl dark:bg-slate-900">
                                  <DropdownMenuItem onClick={() => handleEditClick(user)} className="gap-2 font-bold py-2 cursor-pointer text-xs dark:text-slate-200"><SettingsIcon className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تعديل الصلاحيات' : 'Edit Permissions'}</DropdownMenuItem>
                                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                                  <DropdownMenuItem onClick={() => setDeletingUserId(user.id)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs focus:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'حذف الحساب' : 'Delete Account'}</DropdownMenuItem>
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

      {/* PROVISIONING DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[950px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white relative">
             <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="w-32 h-32 text-white" /></div>
             <DialogHeader className={cn("text-right rtl:text-right ltr:text-left relative z-10")}>
                <DialogTitle className="text-xl font-black flex items-center gap-3">
                   <Key className="w-5 h-5 text-emerald-300" />
                   {editingUserId ? (isRtl ? 'إدارة صلاحيات المستخدم' : 'Manage User Permissions') : (isRtl ? 'إنشاء حساب مستخدم جديد' : 'Provision New User')}
                </DialogTitle>
                <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Granular access control & role mapping</p>
             </DialogHeader>
          </div>

          <form onSubmit={handleSaveUser} className="bg-white dark:bg-slate-900 flex flex-col max-h-[85vh]">
             <ScrollArea className="flex-1 p-6" dir={dir}>
                <div className="space-y-10">
                   <div className="flex flex-col md:flex-row gap-8 items-start">
                      {/* Left: Avatar Upload */}
                      <div className="w-full md:w-32 space-y-2 flex flex-col items-center shrink-0">
                         <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block text-center">PROFILE PHOTO</Label>
                         <div onClick={() => !isCompressing && fileInputRef.current?.click()} className="w-32 h-32 rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all overflow-hidden relative">
                           {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" alt="profile" /> : (
                             <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500">
                               {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
                               <span className="text-[9px] font-black uppercase tracking-widest">{isRtl ? 'رفع صورة' : 'Upload'}</span>
                             </div>
                           )}
                           {formData.photoUrl && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCcw className="w-5 h-5 text-white" /></div>}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </div>

                      {/* Right: Info Fields */}
                      <div className="flex-1 space-y-6 w-full">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 text-right">
                               <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start">
                                 <UserIcon className="w-3 h-3 text-emerald-600" /> {isRtl ? 'الاسم الكامل' : 'FULL NAME'}
                               </Label>
                               <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-slate-100" placeholder={isRtl ? "اسم المستخدم الحقيقي" : "Legal Full Name"} required />
                            </div>
                            <div className="space-y-2 text-right">
                               <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start">
                                 <Mail className="w-3 h-3 text-emerald-600" /> {isRtl ? 'البريد الإلكتروني (اسم المستخدم)' : 'EMAIL / USERNAME'}
                               </Label>
                               <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-slate-100" placeholder="name@association.com" required />
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 text-right">
                               <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start">
                                 <Key className="w-3 h-3 text-emerald-600" /> {isRtl ? 'كلمة المرور' : 'PASSWORD'}
                               </Label>
                               {editingUserId ? (
                                 <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-center gap-2">
                                   <AlertCircle className="w-4 h-4 text-amber-600" />
                                   <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">{isRtl ? 'كلمة المرور مدارة أمنياً ولا يمكن تعديلها من هنا.' : 'Password managed by security rules.'}</p>
                                 </div>
                               ) : (
                                 <div className="relative">
                                    <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-slate-100" placeholder="••••••••" required />
                                    <Lock className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-300" />
                                 </div>
                               )}
                            </div>
                            <div className="space-y-2 text-right">
                               <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-start">
                                 <Briefcase className="w-3 h-3 text-emerald-600" /> {isRtl ? 'الدور الوظيفي الأساسي' : 'ASSIGNED ROLE'}
                               </Label>
                               <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100" dir={dir}>
                                  <option value="staff">{isRtl ? 'موظف تشغيل' : 'Staff'}</option>
                                  <option value="manager">{isRtl ? 'مدير قسم' : 'Manager'}</option>
                                  <option value="admin">{isRtl ? 'مدير نظام (كامل الصلاحيات)' : 'Administrator'}</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* PERMISSIONS MATRIX */}
                   <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                         <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{isRtl ? 'شبكة صلاحيات الواجهات والعمليات' : 'Access Matrix'}</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'تطبق التغييرات لحظياً عند حفظ البيانات' : 'Applied on save'}</p>
                         </div>
                         <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Checkbox id="selectAll" onCheckedChange={(val) => handleToggleAll(!!val)} className="data-[state=checked]:bg-slate-900" />
                            <label htmlFor="selectAll" className="text-[9px] font-black text-slate-600 dark:text-slate-400 cursor-pointer uppercase">{isRtl ? 'تحديد كافة الصلاحيات' : 'FULL SYSTEM ACCESS'}</label>
                         </div>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                         <Table className="text-right border-separate border-spacing-0">
                            <TableHeader className="bg-slate-50 dark:bg-slate-800">
                               <TableRow>
                                  <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'واجهة النظام' : 'INTERFACE / MODULE'}</TableHead>
                                  <TableHead className="w-24 text-center">
                                     <div className="flex flex-col items-center gap-1.5 py-1">
                                        <Checkbox onCheckedChange={(val) => handleToggleColumn('read', !!val)} className="data-[state=checked]:bg-blue-600" />
                                        <span className="text-[9px] font-black text-blue-600 uppercase">{isRtl ? 'دخول/قراءة' : 'READ'}</span>
                                     </div>
                                  </TableHead>
                                  <TableHead className="w-24 text-center">
                                     <div className="flex flex-col items-center gap-1.5 py-1">
                                        <Checkbox onCheckedChange={(val) => handleToggleColumn('create', !!val)} className="data-[state=checked]:bg-emerald-600" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase">{isRtl ? 'إضافة' : 'CREATE'}</span>
                                     </div>
                                  </TableHead>
                                  <TableHead className="w-24 text-center">
                                     <div className="flex flex-col items-center gap-1.5 py-1">
                                        <Checkbox onCheckedChange={(val) => handleToggleColumn('edit', !!val)} className="data-[state=checked]:bg-amber-600" />
                                        <span className="text-[9px] font-black text-amber-600 uppercase">{isRtl ? 'تعديل' : 'EDIT'}</span>
                                     </div>
                                  </TableHead>
                                  <TableHead className="w-24 text-center">
                                     <div className="flex flex-col items-center gap-1.5 py-1">
                                        <Checkbox onCheckedChange={(val) => handleToggleColumn('delete', !!val)} className="data-[state=checked]:bg-rose-600" />
                                        <span className="text-[9px] font-black text-rose-600 uppercase">{isRtl ? 'حذف' : 'DELETE'}</span>
                                     </div>
                                  </TableHead>
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {SYSTEM_MODULES.map(module => {
                                  const perms = formData.permissions[module.id] || { read: false, create: false, edit: false, delete: false };
                                  const isRowFull = perms.read && perms.create && perms.edit && perms.delete;
                                  return (
                                    <TableRow key={module.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                       <TableCell className={cn("px-6 py-3 font-bold text-xs dark:text-slate-200", isRtl ? "text-right" : "text-left")}>
                                          <div className="flex items-center gap-4">
                                             <Checkbox 
                                               checked={isRowFull} 
                                               onCheckedChange={(val) => handleToggleRow(module.id, !!val)} 
                                               className="data-[state=checked]:bg-slate-900" 
                                             />
                                             <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 transition-colors group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:text-emerald-600">
                                                   {module.icon}
                                                </div>
                                                <div className="flex flex-col">
                                                   <span className="font-black text-slate-800 dark:text-slate-100">{isRtl ? module.labelAr : module.labelEn}</span>
                                                   <span className="text-[9px] text-slate-400 font-bold uppercase tabular-nums tracking-tighter">{module.id}</span>
                                                </div>
                                             </div>
                                          </div>
                                       </TableCell>
                                       <TableCell className="text-center">
                                          <Checkbox checked={perms.read} onCheckedChange={() => handleTogglePermission(module.id, 'read')} className="data-[state=checked]:bg-blue-600" />
                                       </TableCell>
                                       <TableCell className="text-center">
                                          <Checkbox checked={perms.create} onCheckedChange={() => handleTogglePermission(module.id, 'create')} className="data-[state=checked]:bg-emerald-600" />
                                       </TableCell>
                                       <TableCell className="text-center">
                                          <Checkbox checked={perms.edit} onCheckedChange={() => handleTogglePermission(module.id, 'edit')} className="data-[state=checked]:bg-amber-600" />
                                       </TableCell>
                                       <TableCell className="text-center">
                                          <Checkbox checked={perms.delete} onCheckedChange={() => handleTogglePermission(module.id, 'delete')} className="data-[state=checked]:bg-rose-600" />
                                       </TableCell>
                                    </TableRow>
                                  );
                               })}
                            </TableBody>
                         </Table>
                      </div>
                   </div>
                </div>
             </ScrollArea>

             <div className="flex-none p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl border-none transition-all active:scale-95">
                   {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <ShieldCheck className="w-5 h-5 me-2" />}
                   {isRtl ? (editingUserId ? 'حفظ تعديلات الصلاحيات' : 'ترحيل الحساب وتفعيل الصلاحيات') : 'Commit Security Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="px-8 h-14 font-black text-slate-400 dark:text-slate-500 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all">إلغاء</Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[1.5rem] p-0 overflow-hidden dark:bg-slate-900 border-none shadow-2xl">
           <div className="bg-rose-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldAlert className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'سحب صلاحيات المستخدم' : 'Revoke Account'}</AlertDialogTitle>
              <AlertDialogDescription className="text-rose-200/50 font-bold mt-2 text-xs leading-relaxed text-center">
                {isRtl ? 'هل أنت متأكد من سحب صلاحيات هذا المستخدم تماماً؟ لن يتمكن من تسجيل الدخول للنظام مرة أخرى.' : 'Are you sure? This user will no longer be able to log in.'}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={async () => { if (!db || !deletingUserId) return; await updateDoc(doc(db, 'users', deletingUserId), { active: false, status: 'deleted', deletedAt: serverTimestamp() }); setDeletingUserId(null); toast({ title: isRtl ? "تم سحب الصلاحيات" : "Access Revoked" }); }} className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl border-none shadow-lg transition-all active:scale-95">تأكيد الحذف</AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 font-black rounded-xl text-slate-400 border-none">تراجع</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
