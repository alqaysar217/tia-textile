
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Quote, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TestimonialsProps {
  showViewMore?: boolean;
  limit?: number;
}

export function Testimonials({ showViewMore = false, limit }: TestimonialsProps) {
  const { lang, t, dir } = useTranslation();

  const allReviews = [
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
    },
    {
      nameAr: 'عمر المفلحي',
      nameEn: 'Omar Al-Muflihi',
      roleAr: 'مغترب يمني',
      roleEn: 'Yemeni Expat',
      contentAr: 'اشتريت عدة معاوز لهدايا في الخارج. الجميع أعجب بجودة العمل ودقة النقوش. الجمعية تمثل اليمن خير تمثيل.',
      contentEn: 'I bought several Maawiz for gifts abroad. Everyone admired the quality of work and precision of patterns. The association represents Yemen perfectly.',
      rating: 5,
      image: 'https://picsum.photos/seed/user4/100/100'
    },
    {
      nameAr: 'علي باحاج',
      nameEn: 'Ali Bahaj',
      roleAr: 'مهتم بالتراث',
      roleEn: 'Heritage Enthusiast',
      contentAr: 'من الرائع رؤية الحفاظ على هذا التراث في الروضة. المعاوز التي تنتجها الجمعية لها روح خاصة لا تجدها في الصناعات الآلية.',
      contentEn: 'It is wonderful to see this heritage preserved in Al-Rawdah. The Maawiz produced by the association have a special spirit not found in machine-made industries.',
      rating: 5,
      image: 'https://picsum.photos/seed/user5/100/100'
    },
    {
      nameAr: 'محمد بن سالم',
      nameEn: 'Mohammed Bin Salem',
      roleAr: 'عميل جديد',
      roleEn: 'New Customer',
      contentAr: 'سرعة في التجاوب عبر واتساب ودقة في الوصف. وصلتني الطلبية كما تمنيت وأكثر. أنصح الجميع بالتعامل معهم.',
      contentEn: 'Fast response via WhatsApp and accurate description. The order arrived exactly as I hoped and more. I recommend everyone to deal with them.',
      rating: 5,
      image: 'https://picsum.photos/seed/user6/100/100'
    }
  ];

  const displayReviews = limit ? allReviews.slice(0, limit) : allReviews;

  return (
    <section className="py-20 bg-muted/20 relative overflow-hidden">
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
          {displayReviews.map((review, idx) => (
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

        {showViewMore && (
          <div className="mt-16 text-center">
            <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-base font-black border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-xl group" asChild>
              <Link href="/testimonials">
                {t.testimonials.viewMore}
                {dir === 'rtl' ? <ArrowLeft className="ms-2 h-5 w-5 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="ms-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
