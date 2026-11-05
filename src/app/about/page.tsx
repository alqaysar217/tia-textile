
'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { StatsSection } from '@/components/StatsSection';

export default function AboutPage() {
  const { lang, t } = useTranslation();

  const timeline = [
    { year: '1973', titleAr: 'التأسيس', titleEn: 'Establishment', descAr: 'تأسيس الجمعية بـ 50 عضواً مؤسساً بهدف حماية حرفة حياكة المعاوز اليدوية.', descEn: 'The association was founded with 50 founding members to protect manual Maawiz weaving.' },
    { year: '1980s-90s', titleAr: 'التوسع والنمو', titleEn: 'Growth & Expansion', descAr: 'توسيع نطاق الإنتاج ودعم الحرفيين المحليين في مديرية الروضة.', descEn: 'Expanding production and supporting local artisans in Al-Rawdah district.' },
    { year: '2010s', titleAr: 'تطوير شبكة الإنتاج', titleEn: 'Production Network', descAr: 'بناء شبكة إنتاج تعاونية أكبر لزيادة القدرة الإنتاجية السنوية.', descEn: 'Building a larger cooperative production network to increase annual capacity.' },
    { year: 'اليوم', titleAr: 'الحاضر', titleEn: 'Present Day', descEn: 'More than 3,000 members with an ongoing commitment to Yemeni heritage.', descAr: 'أكثر من 3000 عضو والتزام مستمر بالحفاظ على التراث النسيجي اليمني.' }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t.about.historyTitle}
            </h1>
            <div className="prose prose-lg text-muted-foreground leading-relaxed">
              <p>{t.about.content}</p>
              <p>{t.about.historyContent}</p>
              <p>
                {lang === 'ar' 
                  ? 'لم تكن الجمعية مجرد جهة لإنتاج المعاوز، بل كانت ولا تزال جزءاً من ذاكرة الصناعة الشعبية اليمنية. إن كل قطعة تنتجها الجمعية تحمل جانباً من تراثنا، وخبرة حرفيينا، وقصة صناعة يمنية نفخر بها.'
                  : 'The association is not just a place for producing Maawiz, but part of the Yemeni popular industry memory. Every piece we produce carries heritage, craftsmanship experience, and a story of Yemeni industry we are proud of.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://picsum.photos/seed/hist1/600/800" alt="History 1" className="rounded-2xl shadow-lg" />
            <img src="https://picsum.photos/seed/hist2/600/800" alt="History 2" className="rounded-2xl shadow-lg mt-12" />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center">{lang === 'ar' ? 'مسيرتنا التاريخية' : 'Our Historical Journey'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative p-8 bg-background rounded-2xl border hover:border-primary transition-colors">
                <div className="text-primary font-bold text-2xl mb-4">{item.year}</div>
                <h3 className="text-xl font-bold mb-3">{lang === 'ar' ? item.titleAr : item.titleEn}</h3>
                <p className="text-muted-foreground text-sm">{lang === 'ar' ? item.descAr : item.descEn}</p>
              </div>
            ))}
          </div>
        </div>

        <StatsSection />
      </div>
    </div>
  );
}
