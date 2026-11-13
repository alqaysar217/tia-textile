'use client';

import React, { useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Send, 
  User, 
  MessageSquare, 
  PhoneCall, 
  Clock,
  ExternalLink,
  MessageCircle,
  Map as MapIcon,
  Layout,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function ContactPage() {
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // جلب الفروع من قاعدة البيانات لضمان المزامنة الكاملة
  const branchesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'branches'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'asc')
    );
  }, [db]);

  const { data: dbBranches, loading } = useCollection<any>(branchesQuery);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Blur Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 -ml-64 -mb-64" />

      <div className="container mx-auto px-4 py-12 md:py-20 flex-grow max-w-7xl">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {lang === 'ar' ? 'نحن هنا لخدمتك' : 'GET IN TOUCH'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            {t.contact.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12 md:mb-20">
          {/* Info Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-primary text-primary-foreground rounded-[2rem] p-8 shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <MessageCircle className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 space-y-8">
                <h2 className="text-2xl font-black">{lang === 'ar' ? 'معلومات التواصل المباشر' : 'Direct Contact Info'}</h2>
                
                <div className="space-y-6">
                  <a href="tel:0777263091" className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-primary transition-all shadow-inner">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{t.contact.phone}</p>
                      <p className="text-xl font-black tabular-nums" dir="ltr">0777 263 091</p>
                    </div>
                  </a>

                  <a href="mailto:nseeg202020@gmail.com" className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-primary transition-all shadow-inner">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{t.contact.email}</p>
                      <p className="text-base font-black truncate">nseeg202020@gmail.com</p>
                    </div>
                  </a>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white hover:text-primary transition-all shadow-sm">
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white hover:text-primary transition-all shadow-sm">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href="https://wa.me/967771687041" target="_blank" rel="noopener" className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-sm">
                    <Phone className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Branches List - Linked by ID for auto-scroll */}
            <div className="space-y-4" id="branches-list">
              <h3 className="text-xl font-black flex items-center gap-3 text-foreground/80 px-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {lang === 'ar' ? 'فروعنا ومراكزنا' : 'Our Branches'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="p-10 text-center animate-pulse text-slate-400 font-bold">{isRtl ? 'جاري جلب الفروع...' : 'Loading branches...'}</div>
                ) : dbBranches && dbBranches.length > 0 ? (
                  dbBranches.map((branch: any, idx: number) => (
                    <div key={branch.id} className="bg-muted/30 border border-border/50 rounded-[2rem] p-6 flex gap-5 group hover:bg-background hover:shadow-xl transition-all duration-300" dir="rtl">
                      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 justify-center flex flex-col text-right">
                        <h4 className="font-black text-sm md:text-base leading-tight">{branch.nameAr}</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          {branch.addressAr}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 justify-start">
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full tabular-nums">
                            {branch.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed text-muted-foreground text-xs font-bold">
                    {isRtl ? 'لا توجد فروع مسجلة حالياً.' : 'No branches registered yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-primary/5 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 textile-pattern opacity-[0.05]" />
              
              <div className="max-w-xl mx-auto space-y-10 relative z-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-foreground">{lang === 'ar' ? 'أرسل لنا رسالة سريعة' : 'Send a Fast Message'}</h2>
                  <p className="text-sm font-medium text-muted-foreground">{lang === 'ar' ? 'سنقوم بالرد عليك خلال أقل من 24 ساعة.' : 'We will respond in less than 24 hours.'}</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ps-1">
                        <User className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <Input 
                        className="h-14 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-5 text-base"
                        placeholder={lang === 'ar' ? 'اكتب اسمك هنا' : 'Enter your name'}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ps-1">
                        <PhoneCall className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                      </label>
                      <Input 
                        className="h-14 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-5 text-base"
                        placeholder="7XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ps-1">
                      <Layout className="w-4 h-4 text-primary" />
                      {lang === 'ar' ? 'الموضوع' : 'Subject'}
                    </label>
                    <Input 
                      className="h-14 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-5 text-base"
                      placeholder={lang === 'ar' ? 'بماذا يمكننا مساعدتك؟' : 'How can we help?'}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ps-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      {lang === 'ar' ? 'محتوى الرسالة' : 'Your Message'}
                    </label>
                    <Textarea 
                      rows={5}
                      className="rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-5 py-4 resize-none text-base"
                      placeholder={lang === 'ar' ? 'اكتب تفاصيل استفسارك هنا...' : 'Write your details here...'}
                    />
                  </div>

                  <Button className="w-full h-16 rounded-[1.25rem] text-lg font-black shadow-xl shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all gap-3 bg-primary hover:bg-primary/90">
                    <Send className="w-6 h-6" />
                    {lang === 'ar' ? 'إرسال الرسالة الآن' : 'Send Message Now'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="space-y-8">
          <h3 className="text-2xl md:text-3xl font-black flex items-center gap-4 text-foreground px-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <MapIcon className="w-6 h-6" />
            </div>
            {lang === 'ar' ? 'خريطة مواقعنا بدقة' : 'Our Precise Map Locations'}
          </h3>
          
          <div className="relative w-full h-[450px] md:h-[650px] rounded-[3rem] overflow-hidden border border-border/50 shadow-2xl group">
            {/* Main Showroom Location (Ataq) */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15456.985652514336!2d46.82025185!3d14.5245846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x161c360938b8d96f%3A0x8e83b0f5b128704!2sAtaq!5e0!3m2!1sen!2sye!4v1715600000000!5m2!1sen!2sye" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[0.1] contrast-[1.05] group-hover:grayscale-0 transition-all duration-700"
            ></iframe>
            
            {/* Map Overlay Card */}
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-[420px] bg-background/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl pointer-events-none md:pointer-events-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {lang === 'ar' ? 'فرع عتق الرئيسي' : 'Main Ataq Branch'}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {lang === 'ar' 
                      ? 'يقع معرضنا الرئيسي في مدينة عتق، الشارع العام، بجانب مسجد الرحمن وأمام بن رازم للمواد الغذائية. كما نرحب بكم في فرعنا داخل شبوة مول.' 
                      : 'Our main showroom is located in Ataq City, Main St, next to Al-Rahman Mosque, opposite Bin Razem Foodstuffs. We also welcome you at our Shabwa Mall branch.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button size="sm" variant="ghost" className="rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 pointer-events-auto h-12 border border-primary/10" asChild>
                    <a href="https://maps.google.com/?q=Al-Rawdah,Shabwah,Yemen" target="_blank" rel="noopener">
                      {lang === 'ar' ? 'الروضة' : 'Al-Rawdah'}
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 pointer-events-auto h-12 border border-primary/10" asChild>
                    <a href="https://maps.google.com/?q=Shabwah+Mall,Ataq,Yemen" target="_blank" rel="noopener">
                      {lang === 'ar' ? 'شبوة مول' : 'Shabwa Mall'}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}