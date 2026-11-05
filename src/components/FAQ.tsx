
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQ() {
  const { lang } = useTranslation();

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
      aAr: 'يقع المقر الرئيسي في مديرية الروضة، محافظة شبوة. ولدينا فرع مبيعات في مدينة عتق (شبوة مول).',
      aEn: 'The HQ is in Al-Rawdah, Shabwa. We have a sales branch in Ataq City (Shabwa Mall).'
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
      aAr: 'يمكنك اختيار المنتجات وإضافتها للسلة ثم إتمام الطلب عبر واتساب للتواصل المباشر وتأكيد التفاصيل.',
      aEn: 'You can choose products, add them to the cart, and complete the order via WhatsApp for direct communication.'
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
          <p className="text-muted-foreground">{lang === 'ar' ? 'إليك بعض الإجابات على التساؤلات الأكثر تكراراً.' : 'Here are answers to the most common questions.'}</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b-2 border-muted">
                {/* تم إزالة rtl:flex-row-reverse ليعود السهم للجهة اليسرى في العربي */}
                <AccordionTrigger className="text-lg font-bold hover:text-primary transition-colors text-right">
                  {lang === 'ar' ? faq.qAr : faq.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-md leading-relaxed">
                  {lang === 'ar' ? faq.aAr : faq.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
