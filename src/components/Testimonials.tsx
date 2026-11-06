
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Quote, Star, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
      rating: 5
    },
    {
      nameAr: 'سالم عبدالله',
      nameEn: 'Salem Abdullah',
      roleAr: 'تاجر منسوجات',
      roleEn: 'Textile Trader',
      contentAr: 'كتاجر، أتعامل مع الجمعية منذ سنوات. جودة الخيوط ونوعية "الحليسي" لديهم لا يعلى عليها. التزامهم بالوقت والأصالة هو سر نجاحهم.',
      contentEn: 'As a trader, I have been dealing with the association for years. The thread quality and their "Halisi" type are unmatched. Their commitment to time and authenticity is the secret to their success.',
      rating: 5
    },
    {
      nameAr: 'خالد محمد',
      nameEn: 'Khaled Mohammed',
      roleAr: 'مشتري من عدن',
      roleEn: 'Buyer from Aden',
      contentAr: 'طلبت عبر واتساب ووصلني المعوز إلى عدن في وقت قياسي. التغليف رائع والمنتج في الواقع أجمل من الصور بكثير. شكراً لكم.',
      contentEn: 'I ordered via WhatsApp and received the Maawiz in Aden in record time. The packaging is great and the product in reality is much more beautiful than the photos. Thank you.',
      rating: 5
    },
    {
      nameAr: 'عمر المفلحي',
      nameEn: 'Omar Al-Muflihi',
      roleAr: 'مغترب يمني',
      roleEn: 'Yemeni Expat',
      contentAr: 'اشتريت عدة معاوز لهدايا في الخارج. الجميع أعجب بجودة العمل ودقة النقوش. الجمعية تمثل اليمن خير تمثيل.',
      contentEn: 'I bought several Maawiz for gifts abroad. Everyone admired the quality of work and precision of patterns. The association represents Yemen perfectly.',
      rating: 5
    },
    {
      nameAr: 'علي باحاج',
      nameEn: 'Ali Bahaj',
      roleAr: 'مهتم بالتراث',
      roleEn: 'Heritage Enthusiast',
      contentAr: 'من الرائع رؤية الحفاظ على هذا التراث في الروضة. المعاوز التي تنتجها الجمعية لها روح خاصة لا تجدها في الصناعات الآلية.',
      contentEn: 'It is wonderful to see this heritage preserved in Al-Rawdah. The Maawiz produced by the association have a special spirit not found in machine-made industries.',
      rating: 5
    },
    {
      nameAr: 'محمد بن سالم',
      nameEn: 'Mohammed Bin Salem',
      roleAr: 'عميل جديد',
      roleEn: 'New Customer',
      contentAr: 'سرعة في التجاوب عبر واتساب ودقة في الوصف. وصلتني الطلبية كما تمنيت وأكثر. أنصح الجميع بالتعامل معهم.',
      contentEn: 'Fast response via WhatsApp and accurate description. The order arrived exactly as I hoped and more. I recommend everyone to deal with them.',
      rating: 5
    }
  ];

  const displayReviews = limit ? allReviews.slice(0, limit) : allReviews;

  // Define alternating identity colors for avatars
  const avatarColors = [
    'bg-primary/10 text-primary border-primary/20',
    'bg-secondary/10 text-secondary border-secondary/20',
    'bg-accent text-accent-foreground border-accent-foreground/10'
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -z-10 -ml-32 -mb-32" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <Star className="h-3 w-3 fill-primary" />
            {lang === 'ar' ? 'ثقة ومصداقية' : 'TRUST & CREDIBILITY'}
          </div>
          <h2 className="text-2xl md:text-5xl font-black text-foreground">
            {t.testimonials.title}
          </h2>
          <p className="text-muted-foreground text-xs md:text-lg font-medium">
            {t.testimonials.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {displayReviews.map((review, idx) => (
            <div 
              key={idx} 
              className="group bg-background p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 relative"
            >
              <Quote className="absolute top-4 right-6 md:top-6 md:right-8 h-8 w-8 md:h-10 md:w-10 text-primary/5 group-hover:text-primary/10 transition-colors" />
              
              <div className="flex gap-1 mb-4 md:mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-secondary text-secondary" />
                ))}
              </div>

              <p className="text-muted-foreground text-xs md:text-base leading-relaxed mb-6 md:mb-8 font-medium italic relative z-10">
                "{lang === 'ar' ? review.contentAr : review.contentEn}"
              </p>

              <div className="flex items-center gap-3 md:gap-4 border-t border-border/50 pt-4 md:pt-6">
                <Avatar className={cn(
                  "h-10 w-10 md:h-12 md:w-12 border-2 flex items-center justify-center transition-colors duration-300",
                  avatarColors[idx % 3]
                )}>
                  <User className="h-5 w-5 md:h-6 md:w-6" />
                </Avatar>
                <div>
                  <h4 className="font-black text-xs md:text-base text-foreground group-hover:text-primary transition-colors">
                    {lang === 'ar' ? review.nameAr : review.nameEn}
                  </h4>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {lang === 'ar' ? review.roleAr : review.roleEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showViewMore && (
          <div className="mt-10 md:mt-16 text-center">
            <Button size="lg" variant="outline" className="rounded-full px-8 md:px-10 h-12 md:h-14 text-sm md:text-base font-black border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-xl group" asChild>
              <Link href="/testimonials">
                {t.testimonials.viewMore}
                {dir === 'rtl' ? <ArrowLeft className="ms-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="ms-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
