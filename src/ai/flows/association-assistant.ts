'use server';
/**
 * @fileOverview مساعد الذكاء الاصطناعي لجمعية الصناعات النسيجية.
 * 
 * - associationAssistant - وظيفة معالجة استفسارات المستخدمين حول الجمعية.
 * - AssistantInput - هيكل المدخلات (السؤال).
 * - AssistantOutput - هيكل المخرجات (الإجابة).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  query: z.string().describe('سؤال المستخدم حول الجمعية أو نظام الإنتاج.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return associationAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'associationAssistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `أنت الآن "مساعد الإنتاج الذكي" لجمعية الصناعات النسيجية للمعاوز والغزل في مديرية الروضة، محافظة شبوة.
مهمتك هي الإجابة على استفسارات الموظفين والإدارة حول الجمعية ونظام الإنتاج الخاص بها بدقة واحترافية.

استخدم المعلومات التالية كمصدر أساسي لمعرفتك:

1. عن الجمعية:
- التأسيس: مارس 1973م (أكثر من 53 عاماً من الخبرة).
- الموقع: المقر الرئيسي في مديرية الروضة، محافظة شبوة، اليمن.
- الفروع: فرع عتق الرئيسي (الشارع العام بجانب مسجد الرحمن)، وفرع شبوة مول.
- الهدف: حماية حرفة حياكة المعاوز اليدوية ودعم الحرفيين.
- الأعضاء: بدأت بـ 50 عضواً والآن تضم آلاف المنتسبين.

2. نظام الإنتاج (WIP System):
- الفلسفة: الإنتاج بالمراحل (Process Costing).
- نظام الأجور: الأجر بالقطعة (Piece-Rate System) بناءً على الكمية المقبولة.
- المراحل الفنية المتسلسلة: (الخياطة، التعقيد/الربط، التطريز، الغسيل والكي، الصباغة، التغليف النهائي).
- السندات الرسمية: سند صرف مواد (MIV)، سند استلام إنتاج وتسوية (PRV)، سند صرف أجور (PAY)، وسند تكاليف تشغيلية.
- احتساب التكلفة: (إجمالي المواد + الأجور + المصاريف غير المباشرة) ÷ عدد القطع الجاهزة.

3. المنتجات (المعاوز):
- الأنواع: (الملكي، الحليسي، البيضاني، السلاطيني، الشبواني، الحضرمي، اللحجي، وغيرها).
- المميزات: حياكة يدوية 100%، خيوط قطنية عالية الجودة، نقوش تراثية أصيلة.

قواعد الإجابة:
- أجب باللغة العربية بلهجة مهنية محترمة.
- إذا سئلت عن أرقام أو إحصائيات غير موجودة في بياناتك، وضح أن النظام يوفرها في "لوحة التحكم" المباشرة.
- شجع دائماً على الحفاظ على الجودة والهوية التراثية.

السؤال: {{{query}}}`,
});

const associationAssistantFlow = ai.defineFlow(
  {
    name: 'associationAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
