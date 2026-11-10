'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronRight, 
  Coins, 
  Save, 
  Loader2, 
  Globe,
  Check,
  ShieldCheck,
  Info,
  Languages,
  Monitor,
  Cpu,
  Database,
  CloudBackup
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    defaultLanguage: 'ar',
    themeMode: 'light',
    aiEnabled: false,
    autoBackup: true
  });

  // Sync saved settings to form
  useEffect(() => {
    if (savedSettings) {
      setFormData({
        baseCurrency: savedSettings.baseCurrency || 'YER',
        defaultLanguage: savedSettings.defaultLanguage || 'ar',
        themeMode: savedSettings.themeMode || 'light',
        aiEnabled: savedSettings.aiEnabled || false,
        autoBackup: savedSettings.autoBackup ?? true
      });
    }
  }, [savedSettings]);

  const handleSaveSettings = async () => {
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ 
        title: lang === 'ar' ? "تم حفظ الإعدادات" : "Settings Saved",
        description: lang === 'ar' ? "تم تحديث تكوين النظام بنجاح." : "System configuration updated successfully."
      });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error saving configuration" });
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
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'النظام' : 'System'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600">{lang === 'ar' ? 'الإعدادات العامة' : 'Core Settings'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تهيئة النظام الموحد' : 'ERP Configuration'}
              </h1>
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            disabled={isSubmitting}
            className="h-10 px-8 premium-gradient hover:opacity-90 text-white rounded-lg shadow-lg font-black text-xs gap-2 border-none transition-all active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {lang === 'ar' ? 'حفظ كافة الإعدادات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
          
          {/* SECTION 1: REGIONAL & LOCALIZATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {lang === 'ar' ? 'الإعدادات الإقليمية واللغة' : 'Regional & Localization'}
              </h3>
            </div>
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
              <SettingRow 
                icon={<Coins className="w-4 h-4 text-slate-400" />}
                title={lang === 'ar' ? 'عملة النظام الأساسية' : 'System Currency'}
                description={lang === 'ar' ? 'تحديد العملة المرجعية لكافة التقارير المالية' : 'Base currency for financial reporting'}
              >
                <Select value={formData.baseCurrency} onValueChange={(v) => setFormData({...formData, baseCurrency: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YER" className="text-xs font-bold">YER - ريال يمني</SelectItem>
                    <SelectItem value="SAR" className="text-xs font-bold">SAR - ريال سعودي</SelectItem>
                    <SelectItem value="USD" className="text-xs font-bold">USD - دولار أمريكي</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow 
                icon={<Languages className="w-4 h-4 text-slate-400" />}
                title={lang === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}
                description={lang === 'ar' ? 'اللغة التي سيعمل بها النظام عند تسجيل الدخول' : 'Preferred language for system interface'}
              >
                <Select value={formData.defaultLanguage} onValueChange={(v) => setFormData({...formData, defaultLanguage: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar" className="text-xs font-bold">العربية (Arabic)</SelectItem>
                    <SelectItem value="en" className="text-xs font-bold">English (الإنجليزية)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </Card>
          </div>

          {/* SECTION 2: INTERFACE & EXPERIENCE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {lang === 'ar' ? 'المظهر وتجربة المستخدم' : 'Interface & Experience'}
              </h3>
            </div>
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
              <SettingRow 
                icon={<div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                title={lang === 'ar' ? 'وضع العرض (Theme)' : 'Display Mode'}
                description={lang === 'ar' ? 'التحكم في سمة النظام بين الوضع الفاتح والداكن' : 'Switch between Light and Dark interface'}
              >
                <Select value={formData.themeMode} onValueChange={(v) => setFormData({...formData, themeMode: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="text-xs font-bold">{lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode'}</SelectItem>
                    <SelectItem value="dark" className="text-xs font-bold">{lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</SelectItem>
                    <SelectItem value="system" className="text-xs font-bold">{lang === 'ar' ? 'حسب النظام' : 'System Sync'}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </Card>
          </div>

          {/* SECTION 3: INTELLIGENCE & ADVANCED FEATURES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {lang === 'ar' ? 'الذكاء الاصطناعي والميزات المتقدمة' : 'Intelligence & Features'}
              </h3>
            </div>
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
              <SettingRow 
                icon={<Cpu className="w-4 h-4 text-slate-400" />}
                title={lang === 'ar' ? 'مساعد الإنتاج الذكي (AI)' : 'AI Production Assistant'}
                description={lang === 'ar' ? 'تفعيل ميزات الذكاء الاصطناعي لتحليل البيانات وتوقع التكاليف' : 'Enable AI for data analysis and predictive costing'}
              >
                <Switch 
                  checked={formData.aiEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, aiEnabled: val})} 
                  className="data-[state=checked]:bg-emerald-600"
                />
              </SettingRow>

              <SettingRow 
                icon={<Database className="w-4 h-4 text-slate-400" />}
                title={lang === 'ar' ? 'النسخ الاحتياطي السحابي' : 'Auto Cloud Backup'}
                description={lang === 'ar' ? 'مزامنة وحماية البيانات بشكل تلقائي ودوري' : 'Automated synchronization and data protection'}
              >
                <Switch 
                  checked={formData.autoBackup} 
                  onCheckedChange={(val) => setFormData({...formData, autoBackup: val})} 
                  className="data-[state=checked]:bg-emerald-600"
                />
              </SettingRow>
            </Card>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-4">
             <div className="p-2 bg-white rounded-lg shadow-sm">
                <Info className="w-5 h-5 text-emerald-600" />
             </div>
             <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                {lang === 'ar' 
                  ? 'يتم تطبيق هذه الإعدادات على مستوى الجمعية بالكامل. بعض التغييرات قد تتطلب إعادة تشغيل المتصفح لتحديث كافة الواجهات بنجاح.' 
                  : 'These settings are applied association-wide. Some changes may require a browser refresh to take full effect across all modules.'}
             </p>
          </div>

        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="flex-none p-3 bg-white border-t border-slate-200 flex items-center justify-center gap-3">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
          Production Control System • v2.1.0 • Global Configuration
        </p>
      </div>

    </div>
  );
}

/**
 * A reusable component for a single setting row in the ERP style.
 */
function SettingRow({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) {
  const { dir } = useTranslation();
  return (
    <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4 text-right rtl:text-right ltr:text-left">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-slate-900">{title}</p>
          <p className="text-[10px] text-slate-400 font-bold">{description}</p>
        </div>
      </div>
      <div className={cn("shrink-0", dir === 'rtl' ? "mr-4" : "ml-4")}>
        {children}
      </div>
    </div>
  );
}
