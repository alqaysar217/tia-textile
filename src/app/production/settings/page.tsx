'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronRight, 
  Coins, 
  Save, 
  Loader2, 
  ShieldCheck, 
  Globe, 
  Info,
  Building2,
  Lock,
  Bell,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function GeneralSettingsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Settings Reference in Firestore
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings, loading } = useDoc<any>(settingsRef);

  const [formData, setFormData] = useState({
    baseCurrency: 'YER',
    companyNameAr: 'جمعية الصناعات النسيجية',
    companyNameEn: 'Textile Industries Association',
    taxId: ''
  });

  // Sync saved settings to form
  useEffect(() => {
    if (savedSettings) {
      setFormData({
        baseCurrency: savedSettings.baseCurrency || 'YER',
        companyNameAr: savedSettings.companyNameAr || 'جمعية الصناعات النسيجية',
        companyNameEn: savedSettings.companyNameEn || 'Textile Industries Association',
        taxId: savedSettings.taxId || ''
      });
    }
  }, [savedSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ 
        title: lang === 'ar' ? "تم حفظ الإعدادات" : "Settings Saved",
        description: lang === 'ar' ? "تم تحديث عملة النظام وكافة الخيارات العامة." : "System currency and options updated."
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
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{lang === 'ar' ? 'الإدارة' : 'System'}</span>
              <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span className="text-emerald-600">{lang === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              {lang === 'ar' ? 'تهيئة النظام والسياسات المالية' : 'System Configuration'}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-8">
          
          {/* CURRENCY & FINANCE SECTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{lang === 'ar' ? 'الإعدادات المالية والعملة' : 'Financial & Currency'}</h3>
            </div>
            
            <Card className="p-6 border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative z-10 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'ar' ? 'عملة النظام الأساسية (Base Currency)' : 'SYSTEM BASE CURRENCY'}
                  </Label>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-4">
                    {lang === 'ar' 
                      ? '* سيتم اعتماد هذه العملة كمرجع موحد لكافة التقارير المالية وحسابات التكاليف والأجور.' 
                      : '* This currency will be the master reference for all financial reports, costing, and payroll.'}
                  </p>
                  
                  <RadioGroup 
                    value={formData.baseCurrency} 
                    onValueChange={(val) => setFormData({...formData, baseCurrency: val})}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {[
                      { value: 'YER', labelAr: 'ريال يمني', labelEn: 'Yemeni Rial', sub: 'YER' },
                      { value: 'SAR', labelAr: 'ريال سعودي', labelEn: 'Saudi Rial', sub: 'SAR' },
                      { value: 'USD', labelAr: 'دولار أمريكي', labelEn: 'US Dollar', sub: 'USD' }
                    ].map((curr) => (
                      <div key={curr.value}>
                        <RadioGroupItem value={curr.value} id={curr.value} className="peer sr-only" />
                        <label
                          htmlFor={curr.value}
                          className={cn(
                            "flex flex-col items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50/50 transition-all cursor-pointer h-full",
                            formData.baseCurrency === curr.value && "border-emerald-500 bg-emerald-50/50"
                          )}
                        >
                          <Wallet className={cn("w-6 h-6 mb-3", formData.baseCurrency === curr.value ? "text-emerald-600" : "text-slate-300")} />
                          <div className="text-center">
                            <p className="text-xs font-black text-slate-900">{lang === 'ar' ? curr.labelAr : curr.labelEn}</p>
                            <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 tracking-widest">{curr.sub}</p>
                          </div>
                          {formData.baseCurrency === curr.value && (
                            <div className="mt-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </Card>
          </section>

          {/* ORGANIZATIONAL INFO */}
          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{lang === 'ar' ? 'هوية الجمعية' : 'Association Identity'}</h3>
            </div>
            
            <Card className="p-6 border-slate-200 shadow-sm rounded-2xl bg-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'اسم الجمعية (عربي)' : 'ASSOCIATION NAME (AR)'}</Label>
                  <input 
                    value={formData.companyNameAr}
                    onChange={(e) => setFormData({...formData, companyNameAr: e.target.value})}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5 text-left" dir="ltr">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">ASSOCIATION NAME (EN)</Label>
                  <input 
                    value={formData.companyNameEn}
                    onChange={(e) => setFormData({...formData, companyNameEn: e.target.value})}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 sticky bottom-6 z-40">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest">{lang === 'ar' ? 'تعديل سياسة النظام' : 'SYSTEM POLICY UPDATE'}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'سيتم تطبيق التغييرات على كافة العمليات الجديدة فور الحفظ.' : 'Changes will apply to all new transactions immediately.'}</p>
                </div>
             </div>
             <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-14 px-10 rounded-2xl premium-gradient text-white font-black text-base shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-95"
              >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
               {lang === 'ar' ? 'حفظ كافة التغييرات' : 'Save System Configuration'}
             </Button>
          </div>
        </form>
      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-white border-t border-slate-100 flex items-center justify-center gap-3">
        <Info className="w-3.5 h-3.5 text-slate-300" />
        <p className="text-[10px] font-bold text-slate-400 italic">
          {lang === 'ar' ? 'ملاحظة: عملة النظام لا تؤثر على السندات المرحلة مسبقاً للحفاظ على سلامة الأرشيف.' : 'Note: System currency does not affect already posted vouchers to maintain archive integrity.'}
        </p>
      </div>

    </div>
  );
}
