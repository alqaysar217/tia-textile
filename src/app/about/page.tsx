
'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { StatsSection } from '@/components/StatsSection';
import { Calendar, Users, History, Award } from 'lucide-react';

export default function AboutPage() {
  const { lang, t } = useTranslation();

  const timeline = [
    { 
      year: '1973', 
      titleAr: 'التأسيس', 
      titleEn: 'Establishment', 
      descAr: 'تأسيس الجمعية بـ 50 عضواً مؤسساً بهدف حماية حرفة حياكة المعاوز اليدوية.', 
      descEn: 'The association was founded with 50 founding members to protect manual Maawiz weaving.', 
      icon: <History className="w-5 h-5 md:w-6 md:h-6" /> 
    },
    { 
      year: '1980s-90s', 
      titleAr: 'التوسع والنمو', 
      titleEn: 'Growth & Expansion', 
      descAr: 'توسيع نطاق الإنتاج ودعم الحرفيين المحليين في مديرية الروضة.', 
      descEn: 'Expanding production and supporting local artisans in Al-Rawdah district.', 
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" /> 
    },
    { 
      year: '2010s', 
      titleAr: 'تطوير شبكة الإنتاج', 
      titleEn: 'Production Network', 
      descAr: 'بناء شبكة إنتاج تعاونية أكبر لزيادة القدرة الإنتاجية السنوية.', 
      descEn: 'Building a larger cooperative production network to increase annual capacity.', 
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" /> 
    },
    { 
      year: 'اليوم', 
      titleAr: 'الحاضر', 
      titleEn: 'Present Day', 
      descEn: 'أكثر من 3000 عضو والتزام مستمر بالحفاظ على التراث النسيجي اليمني.', 
      descAr: 'More than 3,000 members with an ongoing commitment to Yemeni heritage.', 
      icon: <Calendar className="w-5 h-5 md:w-6 md:h-6" /> 
    }
  ];

  return (
    <div className="py-12 md:py-24 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-center mb-16 md:mb-32">
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] md:text-xs font-black uppercase tracking-widest border border-primary/10 w-fit">
              {lang === 'ar' ? 'قصة نجاح تعاونية' : 'Cooperative Success Story'}
            </div>
            <h1 className="text-3xl md:text-6xl font-black leading-[1.1] text-foreground">
              {t.about.historyTitle}
            </h1>
            <div className="space-y-4 md:space-y-6 text-sm md:text-lg text-muted-foreground leading-relaxed font-medium">
              <p>{t.about.content}</p>
              <p>{t.about.historyContent}</p>
              <div className="p-4 md:p-6 bg-primary/5 rounded-2xl border-r-4 border-primary rtl:border-r-4 rtl:border-l-0 ltr:border-l-4 ltr:border-r-0 italic text-primary/80 text-xs md:text-base">
                {lang === 'ar' 
                  ? 'لم تكن الجمعية مجرد جهة لإنتاج المعاوز، بل كانت ولا تزال جزءاً من ذاكرة الصناعة الشعبية اليمنية. إن كل قطعة تنتجها الجمعية تحمل جانباً من تراثنا، وخبرة حرفيينا، وقصة صناعة يمنية نفخر بها.'
                  : 'The association is not just a place for producing Maawiz, but part of the Yemeni popular industry memory. Every piece we produce carries heritage, craftsmanship experience, and a story of Yemeni industry we are proud of.'}
              </div>
            </div>
          </div>
          
          <div className="relative order-1 lg:order-2">
            <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
              <div className="space-y-3 md:space-y-4 pt-6 md:pt-12">
                <div className="aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-white/20">
                  <img src="https://picsum.photos/seed/hist1/600/800" alt="History 1" className="w-full h-full object-cover" data-ai-hint="artisan hands" />
                </div>
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-white/20">
                  <img src="https://picsum.photos/seed/hist3/600/600" alt="History 3" className="w-full h-full object-cover" data-ai-hint="textile detail" />
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-white/20">
                  <img src="https://picsum.photos/seed/hist4/600/600" alt="History 4" className="w-full h-full object-cover" data-ai-hint="traditional weaving" />
                </div>
                <div className="aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-white/20">
                  <img src="https://picsum.photos/seed/hist2/600/800" alt="History 2" className="w-full h-full object-cover" data-ai-hint="yemeni heritage" />
                </div>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-4 -right-4 w-24 h-24 textile-pattern opacity-10 -z-10" />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16 md:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20 space-y-3">
            <h2 className="text-2xl md:text-4xl font-black">{lang === 'ar' ? 'مسيرتنا التاريخية' : 'Our Historical Journey'}</h2>
            <div className="w-12 h-1 bg-secondary mx-auto rounded-full" />
            <p className="text-muted-foreground text-xs md:text-base font-medium px-4">
              {lang === 'ar' ? 'خطوات ثابتة نحو الحفاظ على التراث والتميز النسيجي عبر الأجيال.' : 'Steady steps towards preserving heritage and textile excellence across generations.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {timeline.map((item, idx) => (
              <div key={idx} className="group relative p-4 md:p-8 bg-background rounded-2xl md:rounded-3xl border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rtl:right-auto rtl:left-0">
                  <div className="text-7xl md:text-9xl font-black tabular-nums">{idx + 1}</div>
                </div>
                
                <div className="mb-4 md:mb-6 w-10 h-10 md:w-14 md:h-14 bg-primary/5 rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  {item.icon}
                </div>
                
                <div className="text-primary font-black text-lg md:text-2xl mb-1 md:mb-2 tabular-nums">{item.year}</div>
                <h3 className="text-sm md:text-xl font-black mb-2 md:mb-3 group-hover:text-primary transition-colors line-clamp-1">
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-muted-foreground text-[10px] md:text-sm leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                  {lang === 'ar' ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section Wrapper */}
        <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-muted/20 border border-border/50 shadow-inner">
          <StatsSection />
        </div>
      </div>
    </div>
  );
}

