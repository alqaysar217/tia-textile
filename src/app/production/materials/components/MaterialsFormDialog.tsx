'use client';

import React, { useRef, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Loader2, 
  ImageIcon, 
  UploadCloud, 
  Hash, 
  Activity, 
  Languages, 
  Scale, 
  Coins, 
  Wallet, 
  Box, 
  Gauge, 
  AlertTriangle, 
  Layers 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MaterialsFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: any) => void;
  formData: any;
  setFormData: (v: any) => void;
  editingId: string | null;
  isSubmitting: boolean;
  isCompressing: boolean;
  onImageUpload: (e: any) => void;
  lang: string;
  categories: any[];
  units: any[];
  currencies: any[];
}

export function MaterialsFormDialog({
  isOpen, onClose, onSubmit, formData, setFormData, editingId, isSubmitting, 
  isCompressing, onImageUpload, lang, categories, units, currencies
}: MaterialsFormDialogProps) {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right", !isRtl && "text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-300" />
              {editingId ? (isRtl ? 'تعديل صنف' : 'Update Item') : (isRtl ? 'تعريف مادة خام جديدة' : 'New Raw Material')}
            </DialogTitle>
            <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Definition of production assets & inventory items</p>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 bg-white">
          <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100">
            <div 
              onClick={() => !isCompressing && fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <Avatar className="h-20 w-20 rounded-2xl border-4 border-slate-100 shadow-md bg-slate-50 overflow-hidden">
                <AvatarImage src={formData.photoUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-slate-50 text-slate-300">
                  {isCompressing ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <ImageIcon className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageUpload} />
            <Label className="text-[10px] font-black uppercase text-slate-400">{isRtl ? 'صورة المادة (اختياري)' : 'PHOTO'}</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'كود المادة (تلقائي)' : 'AUTO SKU'} <Hash className="w-3 h-3 text-emerald-600" />
              </Label>
              <Input value={editingId ? formData.code : 'AUTO-GENERATE'} disabled className="h-10 font-bold text-xs bg-slate-100 text-slate-500 tabular-nums text-right" />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'الفئة' : 'CATEGORY'} <Activity className="w-3 h-3 text-emerald-600" />
              </Label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none text-right">
                {categories.map(c => <option key={c.value} value={c.value}>{isRtl ? c.labelAr : c.labelEn}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
              {isRtl ? 'اسم المادة (عربي)' : 'ARABIC NAME'} <Languages className="w-3 h-3 text-emerald-600" />
            </Label>
            <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 text-right" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'الوحدة' : 'UNIT'} <Scale className="w-3 h-3 text-emerald-600" />
              </Label>
              <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold outline-none text-right">
                {units.map(u => <option key={u.value} value={u.value}>{isRtl ? u.labelAr : u.labelEn}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'العملة' : 'CURR.'} <Coins className="w-3 h-3 text-emerald-600" />
              </Label>
              <select 
                value={formData.currency} 
                disabled 
                className="w-full h-10 px-2 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold outline-none cursor-not-allowed text-slate-500 text-right"
              >
                {currencies.map(c => <option key={c.value} value={c.value}>{isRtl ? c.labelAr : c.labelEn}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'سعر الوحدة' : 'PRICE'} <Wallet className="w-3 h-3 text-emerald-600" />
              </Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums text-right" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'الكمية الحالية' : 'OPENING QTY'} <Box className="w-3 h-3 text-emerald-600" />
              </Label>
              <Input 
                type="number" 
                min="0"
                value={formData.currentQty} 
                onChange={(e) => setFormData({...formData, currentQty: Number(e.target.value)})} 
                className={cn(
                  "h-10 font-bold text-xs bg-slate-50 tabular-nums text-right",
                  formData.currentQty < 0 && "border-rose-500 bg-rose-50"
                )} 
              />
              {formData.currentQty < 0 && (
                <p className="text-[9px] font-bold text-rose-600 flex items-center gap-1.5 mt-1 justify-end">
                  {isRtl ? 'لا يسمح بالكميات السالبة' : 'Negative values not allowed'}
                  <AlertTriangle className="w-2.5 h-2.5" />
                </p>
              )}
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-end">
                {isRtl ? 'حد الأمان' : 'MIN LEVEL'} <Gauge className="w-3 h-3 text-emerald-600" />
              </Label>
              <Input type="number" min="0" value={formData.minQty} onChange={(e) => setFormData({...formData, minQty: Number(e.target.value)})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums text-right" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting || isCompressing || formData.currentQty < 0} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
              {isRtl ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Commit Record'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6 h-11 font-black text-slate-400 rounded-md">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
