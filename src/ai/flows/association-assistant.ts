'use server';
/**
 * @fileOverview مساعد الإنتاج الذكي لجمعية الصناعات النسيجية.
 * يعمل باستخدام نموذج Gemma 2 27B عبر OpenRouter لضمان الكفاءة والمجانية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string().describe('رسالة المستخدم الحالية'),
  history: z.array(z.any()).optional().describe('تاريخ المحادثة السابقة'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    return await associationAssistantFlow(input);
  } catch (error: any) {
    console.error("AI Flow Error:", error);
    return { 
      answer: "❌ أعتذر، واجهت مشكلة في معالجة طلبك حالياً. يمكنك إعادة المحاولة أو التواصل مع الدعم الفني." 
    };
  }
}

const associationAssistantFlow = ai.defineFlow(
  {
    name: 'associationAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return { answer: "⚠️ عذراً، مفتاح API (OpenRouter) غير مهيأ في إعدادات الخادم." };
    }

    const systemContent = `أنت "مساعد الإنتاج الذكي" لجمعية الصناعات النسيجية بالروضة، محافظة شبوة.
هويتك: مساعد مهني، ودود، وخبير في تراث المعاوز ونظام الإنتاج الخاص بالجمعية.

المعلومات الأساسية للجمعية:
- التأسيس: 1973م.
- المقر: الروضة، شبوة. الفروع: عتق الرئيسي، شبوة مول.
- النظام: الإنتاج بالمراحل (Process Costing) والأجر بالقطعة.
- المنتجات: (ملكي، حليسي، بيضاني، سلاطيني، شبواني).

قواعد الرد الذكي:
1. القوائم: استخدم الترقيم (1. 2. 3.) بوضوح.
2. الجداول: إذا طُلب منك مقارنات أو قوائم طويلة، استخدم جداول Markdown.
3. التنسيق: أي رابط مهم ضعه في تنسيق (رابط: [الرابط]).
4. التوجيه: إذا سُئلت عن أرقام مالية دقيقة، وجه المستخدم لـ "لوحة التحكم" أو "التقارير" في النظام.
5. الهوية: شجع دائماً على الحفاظ على الجودة والهوية التراثية.

قواعد الرد:
- أجب باللغة العربية الفصحى المبسطة بلهجة محترمة.
- لا تخمن؛ إذا لم تجد المعلومة، اعتذر بلباقة ووجه المستخدم للإدارة.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة تاريخ المحادثة للسياق
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(m => {
        apiMessages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tia-system.vercel.app', // Optional: for OpenRouter analytics
          'X-Title': 'TIA Production System'
        },
        body: JSON.stringify({
          model: 'google/gemma-2-27b-it',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;
      
      return { 
        answer: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً. هل يمكنني مساعدتك في شيء آخر؟' 
      };
    } catch (error: any) {
      return { answer: "🌐 تعذر الاتصال بالعقل الاصطناعي (OpenRouter) حالياً." };
    }
  }
);