'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { Mail, Phone, MapPin, Facebook, Instagram, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="py-20 min-h-screen bg-muted/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">{t.contact.title}</h1>
          <p className="text-xl text-muted-foreground">{t.contact.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info Side */}
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-background rounded-2xl border shadow-sm space-y-4">
                <Phone className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">{t.contact.phone}</h3>
                <p className="text-muted-foreground" dir="ltr">0777 263 091</p>
              </div>
              <div className="p-8 bg-background rounded-2xl border shadow-sm space-y-4">
                <Mail className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">{t.contact.email}</h3>
                <p className="text-muted-foreground">nseeg202020@gmail.com</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{lang === 'ar' ? 'فروعنا ومنافذنا' : 'Our Branches'}</h2>
              <div className="space-y-4">
                {offices.map((office, idx) => (
                  <div key={idx} className="p-6 bg-background rounded-2xl border shadow-sm space-y-3">
                    <h3 className="text-lg font-bold text-primary">{lang === 'ar' ? office.nameAr : office.nameEn}</h3>
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5 shrink-0 text-accent" />
                      <span>{lang === 'ar' ? office.locationAr : office.locationEn}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{lang === 'ar' ? office.descAr : office.descEn}</p>
                    {office.phones && (
                      <div className="pt-2 flex flex-wrap gap-4">
                        {office.phones.map((p, i) => (
                          <a key={i} href={`tel:${p}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors" dir="ltr">
                            {p}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{lang === 'ar' ? 'تابعونا على التواصل الاجتماعي' : 'Follow Us'}</h2>
              <div className="flex gap-4">
                <Button variant="outline" size="lg" className="rounded-full h-14 w-14" asChild>
                  <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener">
                    <Facebook className="h-6 w-6" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full h-14 w-14" asChild>
                  <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener">
                    <Instagram className="h-6 w-6" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full h-14 w-14 hover:bg-[#25D366] hover:text-white transition-colors" asChild>
                  <a href="https://wa.me/967771687041" target="_blank" rel="noopener">
                    <Phone className="h-6 w-6" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-foreground text-background p-10 rounded-3xl space-y-8 shadow-2xl">
            <h2 className="text-3xl font-bold">{lang === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-70">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-primary outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold opacity-70">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-primary outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold opacity-70">{lang === 'ar' ? 'الموضوع' : 'Subject'}</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-primary outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold opacity-70">{lang === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-primary outline-none transition-colors resize-none"></textarea>
              </div>
              <Button className="w-full h-14 text-lg bg-primary hover:bg-primary/90">
                {lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
