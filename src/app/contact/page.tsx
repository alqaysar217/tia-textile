'use client';

import React from 'react';
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
  Layout,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const { lang, t } = useTranslation();

  const offices = [
    {
      nameAr: 'المقر الرئيسي ووحدة الإنتاج',
      nameEn: 'Main Headquarters',
      locationAr: 'مديرية الروضة، محافظة شبوة، اليمن',
      locationEn: 'Al-Rawdah, Shabwa, Yemen',
      descAr: 'مركز الإنتاج التعاوني الرئيسي',
      descEn: 'Main cooperative production center'
    },
    {
      nameAr: 'فرع المبيعات ومعرض عتق',
      nameEn: 'Sales Branch - Ataq',
      locationAr: 'مدينة عتق، شبوة مول',
      locationEn: 'Ataq City, Shabwa Mall',
      descAr: 'المعرض الجديد لتسهيل وصول العملاء لمنتجاتنا',
      descEn: 'New showroom for customer accessibility',
      phones: ['785043425', '783715551', '783715552']
    }
  ];

  return (
    <div className="py-12 md:py-20 min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 -ml-48 -mb-48" />
      <div className="absolute inset-0 textile-pattern opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] md:text-xs font-black uppercase tracking-widest border border-primary/10">
            {lang === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help'}
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-foreground tracking-tight">
            {t.contact.title}
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground font-medium max-w-xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
          {/* Info Side (Column 5) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group p-6 bg-muted/30 rounded-3xl border border-border/50 hover:border-primary/50 transition-all duration-500">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black mb-1">{t.contact.phone}</h3>
                <p className="text-muted-foreground text-xs font-bold tabular-nums" dir="ltr">0777 263 091</p>
              </div>
              <div className="group p-6 bg-muted/30 rounded-3xl border border-border/50 hover:border-primary/50 transition-all duration-500">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black mb-1">{t.contact.email}</h3>
                <p className="text-muted-foreground text-[10px] md:text-xs font-bold truncate">nseeg202020@gmail.com</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                {lang === 'ar' ? 'فروعنا ومنافذنا' : 'Our Branches'}
              </h2>
              <div className="space-y-4">
                {offices.map((office, idx) => (
                  <div key={idx} className="group p-6 bg-background rounded-3xl border border-border/50 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                      <ExternalLink className="h-20 w-20" />
                    </div>
                    <h3 className="text-base md:text-lg font-black text-primary mb-2">
                      {lang === 'ar' ? office.nameAr : office.nameEn}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium mb-3">
                      {lang === 'ar' ? office.locationAr : office.locationEn}
                    </p>
                    {office.phones && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {office.phones.map((p, i) => (
                          <a 
                            key={i} 
                            href={`tel:${p}`} 
                            className="px-3 py-1 bg-muted rounded-full text-[10px] font-black tabular-nums hover:bg-primary hover:text-white transition-colors"
                          >
                            {p}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-primary rounded-3xl text-white shadow-xl shadow-primary/20 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-black text-lg">{lang === 'ar' ? 'تابعنا الآن' : 'Follow Us'}</h3>
                <p className="text-xs text-white/70 font-medium">{lang === 'ar' ? 'كن أول من يعرف جديدنا' : 'Be the first to know'}</p>
              </div>
              <div className="flex gap-2">
                <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Form Side (Column 7) */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/50 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black">{lang === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    {lang === 'ar' ? 'سنقوم بالرد عليك في أقرب وقت ممكن.' : 'We will get back to you as soon as possible.'}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-xs font-black flex items-center gap-2 px-1">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <Input 
                        placeholder={lang === 'ar' ? 'أدخل اسمك هنا' : 'Enter your name'}
                        className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-black flex items-center gap-2 px-1">
                        <PhoneCall className="h-3.5 w-3.5 text-primary" />
                        {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <Input 
                        placeholder="7XX XXX XXX"
                        className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-black flex items-center gap-2 px-1">
                      <Layout className="h-3.5 w-3.5 text-primary" />
                      {lang === 'ar' ? 'موضوع الرسالة' : 'Message Subject'}
                    </label>
                    <Input 
                      placeholder={lang === 'ar' ? 'ما الذي تود الاستفسار عنه؟' : 'What is your inquiry?'}
                      className="h-12 md:h-14 rounded-2xl bg-muted/20 border-border/50 focus:bg-background transition-all"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-black flex items-center gap-2 px-1">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      {lang === 'ar' ? 'تفاصيل الرسالة' : 'Message Details'}
                    </label>
                    <Textarea 
                      rows={5}
                      placeholder={lang === 'ar' ? 'اكتب رسالتك هنا بالتفصيل...' : 'Write your message details here...'}
                      className="rounded-2xl bg-muted/20 border-border/50 focus:bg-background transition-all resize-none p-4"
                    />
                  </div>

                  <Button className="w-full h-14 md:h-16 text-base md:text-lg font-black gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all rounded-2xl">
                    <Send className="h-5 w-5" />
                    {lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
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
