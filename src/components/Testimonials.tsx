
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Quote, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Testimonials() {
  const { lang, t } = useTranslation();

  const reviews = [
    {
      nameAr: 'أحمد صالح اليافعي',
      nameEn: 'Ahmed Saleh Al-Yafei',
      roleAr: 'عميل دائم',
      roleEn: 'Regular Customer',
      contentAr: 'أفضل تجربة شراء لمعوز ملكي على الإطلاق. الحياكة يدوية ومتقنة جداً، والألوان ثابتة بعد عدة غسلات. فخور بوجود مثل هذه الصناعة في شبوة.',
      contentEn: 'The best purchase experience for a Royal Maawiz ever. The hand-weaving is very precise, and the colors remain fast after several washes. Proud to have such industry in Shabwa.',
      rating: 5,
      image: 'https://picsum.photos/seed/user1/100/100'
    },
    {
      nameAr: 'سالم عبدالله',
      nameEn: 'Salem Abdullah',
      roleAr: 'تاجر منسوجات',
      roleEn: 'Textile Trader',
      contentAr: 'كتاجر، أتعامل مع الجمعية منذ سنوات. جودة الخيوط ونوعية "الحليسي" لديهم لا يعلى عليها. التزامهم بالوقت والأصالة هو سر نجاحهم.',
      contentEn: 'As a trader, I have been dealing with the association for years. The thread quality and their "Halisi" type are unmatched. Their commitment to time and authenticity is the secret to their success.',
      rating: 5,
      image: 'https://picsum.photos/seed/user2/100/100'
    },
    {
      nameAr: 'خالد محمد',
      nameEn: 'Khaled Mohammed',
      roleAr: 'مشتري من عدن',
      roleEn: 'Buyer from Aden',
      contentAr: 'طلبت عبر واتساب ووصلني المعوز إلى عدن في وقت قياسي. التغليف رائع والمنتج في الواقع أجمل من الصور بكثير. شكراً لكم.',
      contentEn: 'I ordered via WhatsApp and received the Maawiz in Aden in record time. The packaging is great and the product in reality is much more beautiful than the photos. Thank you.',
      rating: 5,
      image: 'https://picsum.photos/seed/user3/100/100'
    }
  ];

  return (
    <section className="py-20 bg-muted/20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -z-10 -ml-32 -mb-32" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <Star className="h-3 w-3 fill-primary" />
            {lang === 'ar' ? 'ثقة ومصداقية' : 'TRUST & CREDIBILITY'}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-foreground">
            {t.testimonials.title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg font-medium">
            {t.testimonials.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <div 
              key={idx} 
              className="group bg-background p-8 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 relative"
            >
              <Quote className="absolute top-6 right-8 h-10 w-10 text-primary/5 group-hover:text-primary/10 transition-colors" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                ))}
              </div>

              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 font-medium italic relative z-10">
                "{lang === 'ar' ? review.contentAr : review.contentEn}"
              </p>

              <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage src={review.image} alt={lang === 'ar' ? review.nameAr : review.nameEn} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {(lang === 'ar' ? review.nameAr : review.nameEn).substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-black text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                    {lang === 'ar' ? review.nameAr : review.nameEn}
                  </h4>
                  <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {lang === 'ar' ? review.roleAr : review.roleEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
