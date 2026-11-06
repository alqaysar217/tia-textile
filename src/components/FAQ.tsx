
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, HelpCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface FAQProps {
  showViewMore?: boolean;
}

export function FAQ({ showViewMore = false }: FAQProps) {
  const { lang, t, dir } = useTranslation();

  const faqs = [
    {
      qAr: 'ما هي جمعية الصناعات النسيجية؟',
      qEn: 'What is the Textile Industries Association?',
      aAr: 'هي مؤسسة تعاونية يمنية عريقة تأسست عام 1973 في مديرية الروضة بمحافظة شبوة، تهدف للحفاظ على حرفة حياكة المعاوز اليدوية ودعم الحرفيين المحليين.',
      aEn: 'A long-standing Yemeni cooperative founded in 1973 in Al-Rawdah, Shabwa, aiming to preserve hand-woven Maawiz craftsmanship and support local artisans.'
    },
    {
      qAr: 'أين تقع فروع الجمعية؟',
      qEn: 'Where are the association branches located?',
      aAr: 'يقع المقر الرئيسي في مديرية الروضة (شبوة). ولدينا معرضنا الرئيسي في مدينة عتق (الشارع العام، بجانب مسجد الرحمن) وفرع آخر في شبوة مول.',
      aEn: 'The HQ is in Al-Rawdah (Shabwa). We have our main showroom in Ataq City (Main St, next to Al-Rahman Mosque) and another branch in Shabwa Mall.'
    },
    {
      qAr: 'ما الذي يميز معاوز الجمعية عن غيرها؟',
      qEn: 'What distinguishes your Maawiz from others?',
      aAr: 'تتميز منتجاتنا بأنها محاكة يدوياً بالكامل باستخدام أجود أنواع الخيوط القطنية، مع دقة متناهية في النقوش التقليدية (الملكي، الحليسي، البيضاني) التي تعكس أصالة التراث اليمني.',
      aEn: 'Our products are entirely hand-woven using the finest cotton threads, with extreme precision in traditional patterns (Royal, Halisi, Baidani) reflecting authentic Yemeni heritage.'
    },
    {
      qAr: 'كيف يمكنني الطلب والدفع؟',
      qEn: 'How can I order and pay?',
      aAr: 'يمكنك اختيار المنتجات عبر الموقع وإضافتها للسلة، ثم سيتم تحويلك للواتساب لتأكيد الطلب. الدفع يتم حالياً عبر التحويلات المالية (الكريمي أو النجم) أو الدفع عند الاستلام في الفروع.',
      aEn: 'You can select products via the website and add them to the cart, then you will be redirected to WhatsApp to confirm. Payment is currently via money transfers (Kuraimi or Al-Najm) or cash on delivery at branches.'
    },
    {
      qAr: 'هل يتوفر شحن للمحافظات الأخرى أو خارج اليمن؟',
      qEn: 'Is shipping available to other governorates or outside Yemen?',
      aAr: 'نعم، نوفر خدمة الشحن لجميع المحافظات اليمنية عبر شركات النقل المحلية. بالنسبة للشحن الدولي، يرجى التواصل معنا مباشرة لترتيب أفضل وسيلة شحن متاحة.',
      aEn: 'Yes, we provide shipping to all Yemeni governorates via local transport companies. For international shipping, please contact us directly to arrange the best available shipping method.'
    },
    {
      qAr: 'كيف يمكنني الحفاظ على المعوز اليدوي؟',
      qEn: 'How do I care for my handmade Maawiz?',
      aAr: 'ننصح بالغسيل اليدوي بماء فاتر ومنظفات لطيفة، وتجنب استخدام المبيضات أو التجفيف الآلي القوي للحفاظ على جودة الخيوط وثبات الألوان لسنوات طويلة.',
      aEn: 'We recommend hand washing with lukewarm water and gentle detergents, avoiding bleach or strong machine drying to maintain thread quality and color fastness for many years.'
    },
    {
      qAr: 'هل يمكنني طلب "نقشة" خاصة أو مقاس محدد؟',
      qEn: 'Can I request a custom pattern or specific size?',
      aAr: 'نعم، نحن نرحب بالطلبات الخاصة. يمكننا تنفيذ نقوش محددة أو مقاسات خاصة حسب رغبة العميل، مع العلم أن الطلبات الخاصة قد تستغرق وقتاً أطول في الإنتاج اليدوي.',
      aEn: 'Yes, we welcome special orders. We can execute specific patterns or custom sizes according to the customer\'s wish, noting that custom orders may take longer in manual production.'
    }
  ];

  const displayedFaqs = showViewMore ? faqs.slice(0, 4) : faqs;

  return (
    <section className={cn("py-12 md:py-20 bg-background", showViewMore && "py-16 md:py-24")}>
      <div className="container mx-auto px-4">
        {!showViewMore && (
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-2 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground">{t.faq.title}</h2>
            <div className="w-20 h-1.5 bg-secondary rounded-full" />
            <p className="text-muted-foreground text-sm md:text-lg font-medium">{t.faq.subtitle}</p>
          </div>
        )}

        {showViewMore && (
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-primary">{t.faq.title}</h2>
            <p className="text-muted-foreground text-xs md:text-base font-medium">{t.faq.subtitle}</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {displayedFaqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`} 
                className="border border-border/50 rounded-2xl bg-muted/20 px-4 md:px-6 overflow-hidden transition-all data-[state=open]:bg-background data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className={cn(
                  "py-5 text-sm md:text-lg font-black hover:no-underline hover:text-primary transition-colors text-right",
                  lang === 'en' && "text-left"
                )}>
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {lang === 'ar' ? faq.qAr : faq.qEn}
                  </span>
                </AccordionTrigger>
                <AccordionContent className={cn(
                  "text-muted-foreground text-xs md:text-base leading-relaxed pb-6 pt-2 font-medium border-t border-border/50 mt-2",
                  lang === 'ar' ? "text-right" : "text-left"
                )}>
                  {lang === 'ar' ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {showViewMore && (
            <div className="mt-12 text-center">
              <Button variant="outline" className="font-black text-primary border-primary hover:bg-primary hover:text-white rounded-full px-10 h-12 md:h-14 group shadow-lg transition-all" asChild>
                <Link href="/faq">
                  {t.faq.viewMore}
                  {dir === 'rtl' ? <ArrowLeft className="ms-2 h-5 w-5 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="ms-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </Link>
              </Button>
            </div>
          )}

          {!showViewMore && (
            <div className="mt-20 p-8 md:p-12 bg-primary text-primary-foreground rounded-[2.5rem] text-center space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 textile-pattern" />
              <div className="relative z-10 space-y-6">
                <MessageCircle className="w-16 h-16 mx-auto opacity-50" />
                <h3 className="text-2xl md:text-4xl font-black">
                  {lang === 'ar' ? 'لديك سؤال آخر؟' : 'Have another question?'}
                </h3>
                <p className="text-sm md:text-lg opacity-80 max-w-xl mx-auto font-medium">
                  {lang === 'ar' 
                    ? 'فريقنا متاح دائماً للإجابة على جميع استفساراتكم وتزويدكم بالتفاصيل التي تحتاجونها.' 
                    : 'Our team is always available to answer all your inquiries and provide you with the details you need.'}
                </p>
                <Button size="lg" variant="secondary" className="rounded-full px-12 h-14 md:h-16 text-lg font-black shadow-xl hover:scale-105 transition-transform" asChild>
                  <Link href="/contact">{t.nav.contact}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
