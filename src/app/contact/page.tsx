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
  Clock,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const { lang, t } = useTranslation();

  const branches = [
    {
      nameAr: 'المقر الرئيسي ووحدة الإنتاج',
      nameEn: 'Main Headquarters',
      locationAr: 'مديرية الروضة، محافظة شبوة، اليمن',
      locationEn: 'Al-Rawdah, Shabwa, Yemen',
      type: 'hq'
    },
    {
      nameAr: 'فرع المبيعات ومعرض عتق',
      nameEn: 'Sales Branch - Ataq',
      locationAr: 'مدينة عتق، شبوة مول',
      locationEn: 'Ataq City, Shabwa Mall',
      phones: ['785043425', '783715551'],
      type: 'branch'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Blur Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 -ml-64 -mb-64" />

      <div className="container mx-auto px-4 py-12 md:py-20 flex-grow max-w-7xl">
        {/* Compact Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Info Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact Card */}
            <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <MessageCircle className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-black">{lang === 'ar' ? 'معلومات التواصل المباشر' : 'Direct Contact Info'}</h2>
                
                <div className="space-y-4">
                  <a href="tel:0777263091" className="flex items-center gap-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-primary transition-all">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold opacity-60 uppercase">{t.contact.phone}</p>
                      <p className="text-lg font-black tabular-nums" dir="ltr">0777 263 091</p>
                    </div>
                  </a>

                  <a href="mailto:nseeg202020@gmail.com" className="flex items-center gap-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-primary transition-all">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold opacity-60 uppercase">{t.contact.email}</p>
                      <p className="text-sm md:text-base font-black truncate">nseeg202020@gmail.com</p>
                    </div>
                  </a>
                </div>

                <div className="flex gap-3 pt-2">
                  <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Branches Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-foreground/80 px-2">
                <MapPin className="w-5 h-5 text-primary" />
                {lang === 'ar' ? 'فروعنا ومراكزنا' : 'Our Branches'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {branches.map((branch, idx) => (
                  <div key={idx} className="bg-muted/30 border border-border/50 rounded-3xl p-6 flex gap-4 group hover:bg-background hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      {branch.type === 'hq' ? <Clock className="w-6 h-6" /> : <ExternalLink className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm md:text-base">{lang === 'ar' ? branch.nameAr : branch.nameEn}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {lang === 'ar' ? branch.locationAr : branch.locationEn}
                      </p>
                      {branch.phones && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {branch.phones.map((p, i) => (
                            <span key={i} className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full tabular-nums">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-primary/5 h-full">
              <div className="max-w-xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-black mb-2">{lang === 'ar' ? 'أرسل لنا رسالة سريعة' : 'Send a Fast Message'}</h2>
                  <p className="text-xs font-medium text-muted-foreground">{lang === 'ar' ? 'سنقوم بالرد عليك خلال أقل من 24 ساعة.' : 'We will respond in less than 24 hours.'}</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 ps-1">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <Input 
                        className="h-12 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-4"
                        placeholder={lang === 'ar' ? 'اكتب اسمك هنا' : 'Enter your name'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 ps-1">
                        <PhoneCall className="w-3.5 h-3.5 text-primary" />
                        {lang === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                      </label>
                      <Input 
                        className="h-12 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-4"
                        placeholder="7XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 ps-1">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      {lang === 'ar' ? 'الموضوع' : 'Subject'}
                    </label>
                    <Input 
                      className="h-12 rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-4"
                      placeholder={lang === 'ar' ? 'بماذا يمكننا مساعدتك؟' : 'How can we help?'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 ps-1">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                      {lang === 'ar' ? 'محتوى الرسالة' : 'Your Message'}
                    </label>
                    <Textarea 
                      rows={4}
                      className="rounded-2xl bg-muted/20 border-transparent focus:bg-background focus:ring-primary focus:border-primary transition-all px-4 py-3 resize-none"
                      placeholder={lang === 'ar' ? 'اكتب تفاصيل استفسارك هنا...' : 'Write your details here...'}
                    />
                  </div>

                  <Button className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all gap-3">
                    <Send className="w-5 h-5" />
                    {lang === 'ar' ? 'إرسال الرسالة الآن' : 'Send Message Now'}
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
