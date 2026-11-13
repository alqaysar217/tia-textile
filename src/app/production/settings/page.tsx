
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ChevronRight, 
  Coins, 
  Save, 
  Loader2, 
  Globe,
  Monitor,
  Cpu,
  Database,
  ShieldCheck,
  Info,
  Languages,
  RefreshCcw,
  CloudCheck,
  Download,
  ShieldAlert,
  HardDriveDownload,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
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
import { useProduction } from '../ProductionContext';

export default function GeneralSettingsPage() {
  const { lang, dir, setLang } = useTranslation();
  const db = useFirestore();
  
  const { permissions, isAdmin } = useProduction();
  const canEdit = isAdmin || permissions.settings?.edit;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings, loading } = useDoc<any>(settingsRef);

  const [formData, setFormData] = useState({
    baseCurrency: 'YER',
    defaultLanguage: 'ar',
    themeMode: 'light',
    aiEnabled: false,
    autoBackup: true
  });

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

    if (!canEdit) {
      toast({ variant: "destructive", title: lang === 'ar' ? "غير مسموح بتعديل الإعدادات" : "Permission Denied" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      if (formData.defaultLanguage !== lang) {
        setLang(formData.defaultLanguage as any);
      }

      if (formData.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      toast({ 
        title: lang === 'ar' ? "تم حفظ إعدادات النظام" : "Production Settings Saved",
        description: lang === 'ar' ? "تم تحديث بيئة عمل نظام الإنتاج وتطبيق التغييرات فوراً." : "Production environment updated and applied immediately."
      });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error saving configuration" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * دالة النسخ الاحتياطي المحلي الحقيقي (Universal Data Export)
   * تقوم بجلب كافة البيانات من قاعدة البيانات السحابية وتحميلها كملف في جهاز الموظف
   */
  const handleManualBackup = async () => {
    if (isSyncing || !db) return;
    setIsSyncing(true);
    
    toast({
      title: lang === 'ar' ? "بدء استخراج النسخة الاحتياطية" : "Generating Master Backup",
      description: lang === 'ar' ? "يتم الآن تجميع سجلات الجمعية في ملف واحد مؤمن..." : "Collecting all association records into a secured file..."
    });

    try {
      const collectionsToExport = [
        'productionOrders', 'materials', 'workers', 'vouchers', 
        'products', 'departments', 'finishedGoodsWarehouse', 'users'
      ];

      const masterBackup: any = {
        association: "جمعية الصناعات النسيجية - الروضة",
        exportTimestamp: new Date().toISOString(),
        systemVersion: "2.5.0",
        data: {}
      };

      // جلب البيانات من كافة الجداول
      await Promise.all(collectionsToExport.map(async (colName) => {
        const snap = await getDocs(collection(db, colName));
        masterBackup.data[colName] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }));

      // تحويل البيانات لملف JSON وتحميله محلياً
      const dataStr = JSON.stringify(masterBackup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TIA_MASTER_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: lang === 'ar' ? "اكتمل النسخ المحلي" : "Local Backup Ready",
        description: lang === 'ar' ? "تم تحميل " + masterBackup.data.vouchers.length + " سند في ملفك الخاص." : "Saved " + masterBackup.data.vouchers.length + " vouchers to your disk."
      });
    } catch (err) {
      console.error("Backup Error:", err);
      toast({ variant: "destructive", title: "Export Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">جاري جلب تهيئة النظام...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'النظام' : 'System'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? 'إعدادات نظام الإنتاج' : 'Production Core Settings'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {lang === 'ar' ? 'تهيئة بيئة العمل الداخلية' : 'ERP Workspace Configuration'}
              </h1>
            </div>
          </div>

          {canEdit && (
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSubmitting}
              className="h-10 px-8 premium-gradient hover:opacity-90 text-white rounded-lg shadow-lg font-black text-xs gap-2 border-none transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
          
          <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-4 mb-4">
             <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
             </div>
             <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
                {lang === 'ar' 
                  ? 'تنبيه: الإعدادات في هذه الصفحة تخص "نظام إدارة الإنتاج" فقط ولن تؤثر على المظهر أو اللغة في الموقع الإلكتروني العام المخصص للزوار.' 
                  : 'Note: Settings here apply to the "Production Management System" only and will not affect the public website appearance.'}
             </p>
          </div>

          {/* NEW SECTION: DATA GOVERNANCE (The Explanation) */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 px-1 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  {lang === 'ar' ? 'سيادة البيانات والأمان' : 'Data Sovereignty & Security'}
                </h3>
             </div>
             <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600"><CloudCheck className="w-5 h-5" /></div>
                         <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{lang === 'ar' ? 'أين بياناتي الآن؟' : 'Where is my data?'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                        {lang === 'ar' 
                          ? 'بياناتك محفوظة حالياً في سحابة جوجل (Firestore) في مراكز بيانات مؤمنة عالمياً. هي مشفرة ولا يمكن لأحد الوصول إليها إلا بصلاحياتك.' 
                          : 'Your data is stored in Google Cloud (Firestore) in secured data centers. It is encrypted and accessible only with your credentials.'}
                      </p>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600"><HardDriveDownload className="w-5 h-5" /></div>
                         <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{lang === 'ar' ? 'كيف أحميها محلياً؟' : 'How to protect it locally?'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                        {lang === 'ar' 
                          ? 'نحن نؤمن لك "حق الملكية". يمكنك في أي وقت تحميل ملف يحتوي على كافة سجلات الجمعية (السندات، العمال، المخزون) والاحتفاظ به في فلاش ميموري أو جهازك الخاص لضمان العمل في حال توقف السحابة.' 
                          : 'We guarantee your ownership. You can download a file containing all records (vouchers, staff, stock) and keep it in your local storage to ensure business continuity if cloud services fail.'}
                      </p>
                   </div>
                </div>
             </Card>
          </div>

          {/* SECTION 1: REGIONAL & LOCALIZATION */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                {lang === 'ar' ? 'الإعدادات الإقليمية واللغة' : 'Regional & Localization'}
              </h3>
            </div>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              <SettingRow 
                icon={<Coins className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                title={lang === 'ar' ? 'عملة النظام الأساسية' : 'System Currency'}
                description={lang === 'ar' ? 'تحديد العملة المرجعية لكافة التقارير المالية' : 'Base currency for financial reporting'}
              >
                <Select disabled={!canEdit} value={formData.baseCurrency} onValueChange={(v) => setFormData({...formData, baseCurrency: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    <SelectItem value="YER" className="text-xs font-bold">YER - ريال يمني</SelectItem>
                    <SelectItem value="SAR" className="text-xs font-bold">SAR - ريال سعودي</SelectItem>
                    <SelectItem value="USD" className="text-xs font-bold">USD - دولار أمريكي</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow 
                icon={<Languages className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                title={lang === 'ar' ? 'لغة واجهة الإنتاج' : 'Dashboard Language'}
                description={lang === 'ar' ? 'اللغة الافتراضية عند فتح لوحة التحكم' : 'Default language when accessing production'}
              >
                <Select disabled={!canEdit} value={formData.defaultLanguage} onValueChange={(v) => setFormData({...formData, defaultLanguage: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    <SelectItem value="ar" className="text-xs font-bold">العربية (Arabic)</SelectItem>
                    <SelectItem value="en" className="text-xs font-bold">English (الإنجليزية)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </Card>
          </div>

          {/* SECTION 2: INTERFACE & EXPERIENCE */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                {lang === 'ar' ? 'المظهر وتجربة المستخدم' : 'Interface & Experience'}
              </h3>
            </div>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              <SettingRow 
                icon={<div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700" />}
                title={lang === 'ar' ? 'وضع العرض للنظام' : 'System Theme Mode'}
                description={lang === 'ar' ? 'الوضع الفاتح أو الداكن لواجهات الإنتاج فقط' : 'Light or Dark mode for ERP only'}
              >
                <Select disabled={!canEdit} value={formData.themeMode} onValueChange={(v) => setFormData({...formData, themeMode: v})}>
                  <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    <SelectItem value="light" className="text-xs font-bold">{lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode'}</SelectItem>
                    <SelectItem value="dark" className="text-xs font-bold">{lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </Card>
          </div>

          {/* SECTION 3: INTELLIGENCE & ADVANCED FEATURES */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                {lang === 'ar' ? 'الذكاء الاصطناعي والميزات المتقدمة' : 'Intelligence & Features'}
              </h3>
            </div>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              <SettingRow 
                icon={<Cpu className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                title={lang === 'ar' ? 'مساعد الإنتاج الذكي (AI)' : 'AI Production Assistant'}
                description={lang === 'ar' ? 'تفعيل ميزات الذكاء الاصطناعي لتحليل البيانات وتوقع التكاليف' : 'Enable AI for data analysis and predictive costing'}
              >
                <Switch 
                  disabled={!canEdit}
                  checked={formData.aiEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, aiEnabled: val})} 
                  className="data-[state=checked]:bg-emerald-600"
                />
              </SettingRow>

              <SettingRow 
                icon={<Database className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                title={lang === 'ar' ? 'النسخ الاحتياطي والمزامنة' : 'Cloud Sync & Local Backup'}
                description={lang === 'ar' ? 'تأمين السجلات سحابياً وإتاحة التحميل المحلي للبيانات' : 'Automated cloud sync and offline data ownership'}
              >
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleManualBackup} 
                    disabled={isSyncing}
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-4 rounded-lg text-[10px] font-black uppercase border-emerald-100 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-600 transition-all gap-2 shadow-sm"
                  >
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {lang === 'ar' ? 'تحميل نسخة احتياطية (محلي)' : 'Download Backup'}
                  </Button>
                  
                  <Switch 
                    disabled={!canEdit}
                    checked={formData.autoBackup} 
                    onCheckedChange={(val) => setFormData({...formData, autoBackup: val})} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </SettingRow>
            </Card>
          </div>

          {/* DANGER ZONE: DATA PURGE PROTECTION */}
          <div className="pt-8">
             <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm"><ShieldAlert className="w-6 h-6 text-rose-600" /></div>
                   <div className="space-y-1 text-right rtl:text-right ltr:text-left">
                      <h4 className="text-sm font-black text-rose-900 dark:text-rose-100">{lang === 'ar' ? 'منطقة حماية السجلات المجمعة' : 'Data Integrity Zone'}</h4>
                      <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                        {lang === 'ar' 
                          ? 'في حال فقدان الوصول لقاعدة البيانات، يمكنك دائماً استخدام ملف النسخ الاحتياطي المحمل يدوياً لإعادة بناء النظام بالكامل. يُنصح بتحميل نسخة جديدة كل نهاية أسبوع.' 
                          : 'In case of cloud outage, use your local backup file to restore operations. We recommend downloading a fresh copy every weekend.'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="flex-none p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 transition-colors duration-300">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
          TIA Data Governance Protocol • Sovereign Records Management
        </p>
      </div>

    </div>
  );
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-4 text-right rtl:text-right ltr:text-left">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{description}</p>
        </div>
      </div>
      <div className="shrink-0 ms-6">
        {children}
      </div>
    </div>
  );
}
