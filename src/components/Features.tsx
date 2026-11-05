
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { ShieldCheck, Award, Layers, Brush, Users2, Globe2 } from 'lucide-react';

export function Features() {
  const { lang, t } = useTranslation();

  const features = [
    {
      icon: <Award className="h-10 w-10 text-accent" />,
      titleAr: 'تراث يمني أصيل',
      titleEn: 'Authentic Yemeni Heritage',
      descAr: 'منتجات مستوحاة من التراث اليمني الأصيل.',
      descEn: 'Products inspired by authentic Yemeni heritage.'
    },
    {
      icon: <Brush className="h-10 w-10 text-accent" />,
      titleAr: 'حياكة يدوية',
      titleEn: 'Handmade Craftsmanship',
      descAr: 'حياكة يدوية وحرفية متوارثة عبر الأجيال.',
      descEn: 'Manual weaving and craftsmanship passed down through generations.'
    },
    {
      icon: <Layers className="h-10 w-10 text-accent" />,
      titleAr: 'خامات عالية الجودة',
      titleEn: 'Quality Materials',
      descAr: 'الاهتمام باختيار المواد والخامات المناسبة.',
      descEn: 'Attention to choosing the right materials and fabrics.'
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-accent" />,
      titleAr: 'تصاميم فريدة',
      titleEn: 'Unique Designs',
      descAr: 'تنوع النقوش والتصاميم والألوان.',
      descEn: 'Diversity of patterns, designs, and colors.'
    },
    {
      icon: <Users2 className="h-10 w-10 text-accent" />,
      titleAr: 'إنتاج تعاوني',
      titleEn: 'Cooperative Production',
      descAr: 'دعم الحرفيين والأسر المنتجة والمجتمع المحلي.',
      descEn: 'Supporting artisans, productive families, and the local community.'
    },
    {
      icon: <Globe2 className="h-10 w-10 text-accent" />,
      titleAr: 'الحفاظ على الهوية',
      titleEn: 'Cultural Preservation',
      descAr: 'المساهمة في الحفاظ على صناعة المعاوز اليمنية.',
      descEn: 'Contributing to the preservation of Yemeni Maawiz industry.'
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{lang === 'ar' ? 'لماذا تختارنا؟' : 'Why Choose Us?'}</h2>
          <p className="text-muted-foreground">
            {lang === 'ar' 
              ? 'نحن نجمع بين التراث والجودة لنقدم لك أفضل المنسوجات اليمنية.' 
              : 'We combine heritage and quality to provide you with the best Yemeni textiles.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-2xl bg-muted/50 border border-transparent hover:border-accent hover:bg-background transition-all duration-300">
              <div className="mb-6 bg-background p-4 rounded-xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{lang === 'ar' ? feature.titleAr : feature.titleEn}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {lang === 'ar' ? feature.descAr : feature.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
