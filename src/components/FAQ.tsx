
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
      aAr: 'هي مؤسسة تعاونية يمنية تأسست عام 1973 في مديرية الروضة، محافظة شبوة، متخصصة في الحياكة اليدوية للمعاوز والمنسوجات التقليدية.',
      aEn: 'A Yemeni cooperative founded in 1973 in Al-Rawdah, Shabwa, specialized in traditional hand-woven Maawiz and textiles.'
    },
    {
      qAr: 'أين تقع الجمعية؟',
      qEn: 'Where is the association located?',
      aAr: 'يقع المقر الرئيسي في مديرية الروضة، محافظة شبوة. ولدينا فرع مبيعات رئيسي في مدينة عتق (الشارع العام) وفرع آخر في شبوة مول.',
      aEn: 'The HQ is in Al-Rawdah, Shabwa. We have main sales branches in Ataq City (Main St) and Shabwa Mall.'
    },
    {
      qAr: 'ما أنواع المعاوز التي توفرها الجمعية؟',
      qEn: 'What types of Maawiz do you provide?',
      aAr: 'نوفر تشكيلة واسعة تشمل الملكي، الحليسي، البيضاني، الحديدي، والسلاطيني، بالإضافة للشمزان والشيلان.',
      aEn: 'We provide various types including Al-Maliki, Al-Halisi, Al-Baidani, Al-Hadidi, and Al-Salateeni, plus shirts and shawls.'
    },
    {
      qAr: 'كيف يمكنني الطلب؟',
      qEn: 'How can I order?',
      aAr: 'يمكنك اختيار المنتجات وإضافتها للسلة ثم إتمام الطلب عبر واتساب للتواصل المباشر مع فريق المبيعات وتأكيد التفاصيل.',
      aEn: 'You can choose products, add them to the cart, and complete the order via WhatsApp for direct communication with the sales team.'
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t.faq.title}</h2>
          <p className="text-muted-foreground">{t.faq.subtitle}</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b-2 border-muted">
                <AccordionTrigger className={cn(
                  "text-lg font-bold hover:text-primary transition-colors",
                  lang === 'ar' ? "text-right" : "text-left"
                )}>
                  {lang === 'ar' ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className={cn(
                  "text-muted-foreground text-md leading-relaxed",
                  lang === 'ar' ? "text-right" : "text-left"
                )}>
                  {lang === 'ar' ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {showViewMore && (
            <div className="mt-12 text-center">
              <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 rounded-full px-8 group" asChild>
                <Link href="/faq">
                  {t.faq.viewMore}
                  {dir === 'rtl' ? <ArrowLeft className="ms-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
