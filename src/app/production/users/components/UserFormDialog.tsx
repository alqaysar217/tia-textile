'use client';

import React, { useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { 
  Key, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Briefcase, 
  ShieldCheck, 
  RefreshCcw, 
  UploadCloud, 
  Loader2,
  Shield,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { PermissionsTable } from './PermissionsTable';
import { cn } from '@/lib/utils';

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  lang: string;
  dir: string;
  isSubmitting: boolean;
  isCompressing: boolean;
  formData: any;
  setFormData: (val: any) => void;
  onImageUpload: (e: any) => void;
  onSave: (e: any) => void;
}

export function UserFormDialog({
  isOpen,
  onClose,
  editingId,
  lang,
  dir,
  isSubmitting,
  isCompressing,
  formData,
  setFormData,
  onImageUpload,
  onSave
}: UserFormDialogProps) {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTogglePermission = (moduleId: string, type: 'read' | 'create' | 'edit' | 'delete') => {
    setFormData((prev: any) => {
      const newPerms = { ...prev.permissions };
      const current = { ...newPerms[moduleId] };
      current[type] = !current[type];

      // Smart Logic: If any "Action" (Create/Edit/Delete) is checked, "Read" MUST be checked
      if ((current.create || current.edit || current.delete) && !current.read) {
        current.read = true;
      }
      
      newPerms[moduleId] = current;
      return { ...prev, permissions: newPerms };
    });
  };

  const handleToggleRow = (moduleId: string, checked: boolean) => {
    setFormData((prev: any) => {
      const newPerms = { ...prev.permissions };
      const current = newPerms[moduleId];
      
      if (checked) {
        // If row was empty, default to READ. If already has READ, default to ALL.
        if (!current.read && !current.create && !current.edit && !current.delete) {
          newPerms[moduleId] = { read: true, create: false, edit: false, delete: false };
        } else {
          newPerms[moduleId] = { read: true, create: true, edit: true, delete: true };
        }
      } else {
        newPerms[moduleId] = { read: false, create: false, edit: false, delete: false };
      }
      
      return { ...prev, permissions: newPerms };
    });
  };

  const handleToggleColumn = (type: 'read' | 'create' | 'edit' | 'delete', checked: boolean) => {
    setFormData((prev: any) => {
      const newPerms = { ...prev.permissions };
      Object.keys(newPerms).forEach(moduleId => {
        newPerms[moduleId] = { ...newPerms[moduleId], [type]: checked };
        // If enabling create/edit/delete, force read
        if (checked && type !== 'read') {
          newPerms[moduleId].read = true;
        }
      });
      return { ...prev, permissions: newPerms };
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setFormData((prev: any) => {
      const newPerms = { ...prev.permissions };
      Object.keys(newPerms).forEach(moduleId => {
        newPerms[moduleId] = { read: checked, create: checked, edit: checked, delete: checked };
      });
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[950px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
        <div className="premium-gradient p-6 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="w-32 h-32 text-white" /></div>
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left relative z-10")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Key className="w-5 h-5 text-emerald-300" />
              {editingId ? (isRtl ? 'تعديل صلاحيات الوصول' : 'Access Permissions') : (isRtl ? 'بروتوكول تفعيل مستخدم جديد' : 'New User Provisioning')}
            </DialogTitle>
            <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Granular role mapping and security profiling</p>
          </DialogHeader>
        </div>

        <form onSubmit={onSave} className="bg-white dark:bg-slate-900 flex flex-col max-h-[85vh]">
          <ScrollArea className="flex-1 p-6" dir={dir}>
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Photo */}
                <div className="w-full md:w-32 space-y-2 flex flex-col items-center shrink-0">
                   <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 text-center">PROFILE PHOTO</Label>
                   <div onClick={() => !isCompressing && fileInputRef.current?.click()} className="w-32 h-32 rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer group overflow-hidden relative transition-all">
                     {formData.photoUrl ? (
                       <img src={formData.photoUrl} className="w-full h-full object-cover" alt="profile" />
                     ) : (
                       <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-emerald-500">
                         {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
                         <span className="text-[9px] font-black uppercase tracking-widest">{isRtl ? 'رفع صورة' : 'Upload'}</span>
                       </div>
                     )}
                     {formData.photoUrl && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCcw className="w-5 h-5 text-white" /></div>}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageUpload} />
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><UserIcon className="w-3 h-3 text-emerald-600" /> {isRtl ? 'الاسم الكامل' : 'NAME'}</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="h-11 font-bold text-xs bg-slate-50 dark:bg-slate-800 dark:text-white" required />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><Mail className="w-3 h-3 text-emerald-600" /> {isRtl ? 'البريد الإلكتروني' : 'EMAIL'}</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-11 font-bold text-xs bg-slate-50 dark:bg-slate-800 dark:text-white" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><Lock className="w-3 h-3 text-emerald-600" /> {isRtl ? 'كلمة المرور' : 'PASSWORD'}</Label>
                      {editingId ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 rounded-lg flex items-center gap-2">
                           <AlertCircle className="w-4 h-4 text-amber-600" />
                           <p className="text-[10px] font-bold text-amber-700">{isRtl ? 'كلمة المرور مدارة أمنياً ولا يمكن تعديلها من هنا.' : 'Encrypted field.'}</p>
                        </div>
                      ) : (
                        <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-11 font-bold text-xs bg-slate-50 dark:bg-slate-800 dark:text-white" required />
                      )}
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><Briefcase className="w-3 h-3 text-emerald-600" /> {isRtl ? 'الدور الوظيفي' : 'ROLE'}</Label>
                      <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-white" dir={dir}>
                        <option value="staff">{isRtl ? 'موظف تشغيل' : 'Staff'}</option>
                        <option value="manager">{isRtl ? 'مدير قسم' : 'Manager'}</option>
                        <option value="admin">{isRtl ? 'مدير نظام' : 'Admin'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Grid Component */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{isRtl ? 'شبكة صلاحيات الواجهات والعمليات المتقدمة' : 'Advanced Access Matrix'}</h3>
                </div>
                
                <PermissionsTable 
                  lang={lang}
                  permissions={formData.permissions}
                  onTogglePermission={handleTogglePermission}
                  onToggleRow={handleToggleRow}
                  onToggleColumn={handleToggleColumn}
                  onToggleAll={handleToggleAll}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex-none p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl border-none transition-all active:scale-95">
              {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <ShieldCheck className="w-5 h-5 me-2" />}
              {isRtl ? (editingId ? 'تحديث السجل والصلاحيات' : 'تفعيل الحساب والصلاحيات') : 'Commit Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all">إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
