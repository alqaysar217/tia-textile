'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { ShieldCheck, Award, Layers, Brush, Users2, Globe2 } from 'lucide-react';

export function Features() {
  const { lang } = useTranslation();

  const features = [
    {
      icon: <Award className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'تراث يمني أصيل',
      titleEn: 'Authentic Yemeni Heritage',
      descAr: 'منتجات مستوحاة من التراث اليمني الأصيل الذي نفخر به.',
      descEn: 'Products inspired by the authentic Yemeni heritage we take pride in.'
    },
    {
      icon: <Brush className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'حياكة يدوية',
      titleEn: 'Handmade Craftsmanship',
      descAr: 'حياكة يدوية وحرفية متوارثة عبر الأجيال بدقة متناهية.',
      descEn: 'Manual weaving and craftsmanship passed down through generations with extreme precision.'
    },
    {
      icon: <Layers className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'خامات عالية الجودة',
      titleEn: 'Quality Materials',
      descAr: 'نختار بعناية أجود الخيوط القطنية لضمان متانة لا تضاهى.',
      descEn: 'We carefully select the finest cotton threads for unmatched durability.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'تصاميم فريدة',
      titleEn: 'Unique Designs',
      descAr: 'تنوع واسع في النقوش والتصاميم التي تناسب جميع الأذواق.',
      descEn: 'A wide variety of patterns and designs to suit all tastes.'
    },
    {
      icon: <Users2 className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'إنتاج تعاوني',
      titleEn: 'Cooperative Production',
      descAr: 'نعمل بروح الفريق لدعم الحرفيين والأسر في مجتمعنا.',
      descEn: 'We work as a team to support artisans and families in our community.'
    },
    {
      icon: <Globe2 className="h-6 w-6 md:h-8 md:w-8" />,
      titleAr: 'الحفاظ على الهوية',
      titleEn: 'Cultural Preservation',
      descAr: 'نساهم في بقاء صناعة المعاوز اليمنية حية ونابضة.',
      descEn: 'We contribute to keeping the Yemeni Maawiz industry alive and vibrant.'
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12 space-y-2">
          <h2 className="text-xl md:text-3xl font-black text-primary">{lang === 'ar' ? 'لماذا تختارنا؟' : 'Why Choose Us?'}</h2>
          <div className="w-12 h-0.5 bg-secondary mx-auto rounded-full mb-3" />
          <p className="text-muted-foreground text-xs md:text-base">
            {lang === 'ar' 
              ? 'نحن نجمع بين عراقة التراث وجودة الصناعة لنقدم لك الأفضل.' 
              : 'We combine heritage and quality to provide you with the best.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-5 md:p-6 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-background hover:shadow-lg transition-all duration-500 text-center flex flex-col items-center"
            >
              <div className="mb-4 bg-primary/5 p-3 md:p-4 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:scale-105 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {lang === 'ar' ? feature.titleAr : feature.titleEn}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-xs md:text-sm max-w-[240px]">
                {lang === 'ar' ? feature.descAr : feature.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
