
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { ShieldCheck, Award, Layers, Brush, Users2, Globe2 } from 'lucide-react';

export function Features() {
  const { lang, t } = useTranslation();

  const features = [
    {
      icon: <Award className="h-12 w-12" />,
      titleAr: 'تراث يمني أصيل',
      titleEn: 'Authentic Yemeni Heritage',
      descAr: 'منتجات مستوحاة من التراث اليمني الأصيل الذي نفخر به.',
      descEn: 'Products inspired by the authentic Yemeni heritage we take pride in.'
    },
    {
      icon: <Brush className="h-12 w-12" />,
      titleAr: 'حياكة يدوية',
      titleEn: 'Handmade Craftsmanship',
      descAr: 'حياكة يدوية وحرفية متوارثة عبر الأجيال بدقة متناهية.',
      descEn: 'Manual weaving and craftsmanship passed down through generations with extreme precision.'
    },
    {
      icon: <Layers className="h-12 w-12" />,
      titleAr: 'خامات عالية الجودة',
      titleEn: 'Quality Materials',
      descAr: 'نختار بعناية أجود الخيوط القطنية لضمان متانة وراحة لا تضاهى.',
      descEn: 'We carefully select the finest cotton threads to ensure unmatched durability and comfort.'
    },
    {
      icon: <ShieldCheck className="h-12 w-12" />,
      titleAr: 'تصاميم فريدة',
      titleEn: 'Unique Designs',
      descAr: 'تنوع واسع في النقوش والتصاميم والألوان التي تناسب جميع الأذواق.',
      descEn: 'A wide variety of patterns, designs, and colors to suit all tastes.'
    },
    {
      icon: <Users2 className="h-12 w-12" />,
      titleAr: 'إنتاج تعاوني',
      titleEn: 'Cooperative Production',
      descAr: 'نعمل بروح الفريق لدعم الحرفيين والأسر المنتجة في مجتمعنا.',
      descEn: 'We work as a team to support artisans and productive families in our community.'
    },
    {
      icon: <Globe2 className="h-12 w-12" />,
      titleAr: 'الحفاظ على الهوية',
      titleEn: 'Cultural Preservation',
      descAr: 'نساهم في بقاء صناعة المعاوز اليمنية حية ونابضة بالأصالة.',
      descEn: 'We contribute to keeping the Yemeni Maawiz industry alive and vibrant with authenticity.'
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-primary">{lang === 'ar' ? 'لماذا تختارنا؟' : 'Why Choose Us?'}</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg md:text-xl">
            {lang === 'ar' 
              ? 'نحن نجمع بين عراقة التراث وجودة الصناعة لنقدم لك الأفضل.' 
              : 'We combine heritage and quality to provide you with the best.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-10 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-background hover:shadow-2xl transition-all duration-500 text-center flex flex-col items-center"
            >
              <div className="mb-8 bg-primary/5 p-6 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:scale-110 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                {lang === 'ar' ? feature.titleAr : feature.titleEn}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg max-w-[280px]">
                {lang === 'ar' ? feature.descAr : feature.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
