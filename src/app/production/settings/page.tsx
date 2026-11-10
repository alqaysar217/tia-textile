'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronRight, 
  Coins, 
  Save, 
  Loader2, 
  Wallet,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';

export default function GeneralSettingsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Settings Reference in Firestore
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings, loading } = useDoc<any>(settingsRef);

  const [formData, setFormData] = useState({
    baseCurrency: 'YER',
  });

  // Sync saved settings to form
  useEffect(() => {
    if (savedSettings) {
      setFormData({
        baseCurrency: savedSettings.baseCurrency || 'YER',
      });
    }
  }, [savedSettings]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ 
        title: lang === 'ar' ? "تم حفظ الإعدادات" : "Settings Saved",
        description: lang === 'ar' ? "تم تحديث عملة النظام بنجاح." : "System currency updated."
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* COMPACT ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white shadow-sm">
              <Settings className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'النظام' : 'System'}</span>
                <ChevronRight className={cn("w-2.5 h-2.5", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600">{lang === 'ar' ? 'الإعدادات العامة' : 'Core Settings'}</span>
              </div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تهيئة النظام الموحد' : 'ERP Configuration'}
              </h1>
            </div>
          </div>

          <Button 
            onClick={() => handleSaveSettings()} 
            disabled={isSubmitting}
            className="h-9 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black text-xs gap-2 border-none transition-all active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* CURRENCY CONFIG SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                {lang === 'ar' ? 'السياسات المالية والعملة' : 'Financial Policy'}
              </h3>
            </div>
            
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
              <div className="p-5 space-y-5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'ar' ? 'عملة النظام المرجعية' : 'SYSTEM BASE CURRENCY'}
                  </Label>
                  <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                    {lang === 'ar' 
                      ? '* العملة المختارة ستكون الأساس في تقييم المخزون وحساب أرباح الدفعات.' 
                      : '* This currency will define inventory value and production costing.'}
                  </p>
                </div>
                
                <RadioGroup 
                  value={formData.baseCurrency} 
                  onValueChange={(val) => setFormData({...formData, baseCurrency: val})}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: 'YER', labelAr: 'ريال يمني', sub: 'YER' },
                    { value: 'SAR', labelAr: 'ريال سعودي', sub: 'SAR' },
                    { value: 'USD', labelAr: 'دولار أمريكي', sub: 'USD' }
                  ].map((curr) => (
                    <div key={curr.value}>
                      <RadioGroupItem value={curr.value} id={curr.value} className="peer sr-only" />
                      <label
                        htmlFor={curr.value}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50/50 transition-all cursor-pointer h-full relative overflow-hidden",
                          formData.baseCurrency === curr.value && "border-emerald-500 bg-emerald-50/50"
                        )}
                      >
                        <Wallet className={cn("w-5 h-5 mb-2 transition-colors", formData.baseCurrency === curr.value ? "text-emerald-600" : "text-slate-300")} />
                        <div className="text-center relative z-10">
                          <p className="text-[10px] font-black text-slate-900">{lang === 'ar' ? curr.labelAr : curr.value}</p>
                          <p className="text-[8px] font-black text-emerald-600 uppercase mt-0.5 tracking-widest">{curr.sub}</p>
                        </div>
                        {formData.baseCurrency === curr.value && (
                          <div className="absolute top-1 right-1">
                             <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center gap-3">
                 <div className="p-1.5 bg-white rounded border border-slate-200">
                    <Info className="w-3 h-3 text-slate-400" />
                 </div>
                 <p className="text-[9px] font-bold text-slate-500 leading-tight">
                    {lang === 'ar' 
                      ? 'تعديل العملة يؤثر على الواجهات التحليلية وتقارير التكاليف فقط.' 
                      : 'Base currency affects analytics dashboard and costing reports only.'}
                 </p>
              </div>
            </Card>
          </div>

          {/* FUTURE SETTINGS PLACEHOLDER */}
          <div className="pt-4 border-t border-dashed border-slate-200">
             <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
                <Settings className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {lang === 'ar' ? 'إعدادات إضافية قريباً' : 'Extended modules coming soon'}
                </p>
             </div>
          </div>

        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="flex-none p-3 bg-white border-t border-slate-200 flex items-center justify-center gap-3">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Production Control System • v2.0
        </p>
      </div>

    </div>
  );
}
