'use server';
/**
 * @fileOverview مساعد الإنتاج الذكي لجمعية الصناعات النسيجية.
 * تم تحسين الاستقرار ومعالجة أخطاء Next.js Server Actions لضمان استجابة سريعة وموثوقة.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// زيادة مهلة التنفيذ لـ Next.js Server Action لضمان عدم حدوث Timeout
export const maxDuration = 60;

const AssistantInputSchema = z.object({
  message: z.string().describe('رسالة المستخدم الحالية'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe('تاريخ المحادثة السابقة'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

/**
 * وظيفة الخادم الرئيسية لمعالجة طلبات المساعد الذكي.
 */
export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    // التحقق من وجود مفتاح API في البيئة
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { answer: "⚠️ عذراً، مفتاح API (OpenRouter) غير مهيأ في إعدادات الخادم. يرجى التواصل مع الإدارة." };
    }

    const { message, history } = input;

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
3. الهوية: شجع دائماً على الحفاظ على الجودة والهوية التراثية.
4. التوجيه: للمسائل المالية الدقيقة، وجه المستخدم للتقارير في النظام.

قواعد الرد:
- أجب باللغة العربية الفصحى المبسطة بلهجة محترمة.
- لا تخمن؛ إذا لم تجد المعلومة، اعتذر بلباقة ووجه المستخدم للإدارة.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة تاريخ المحادثة للسياق (آخر 6 رسائل لضمان الأداء)
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(m => {
        if (m.role && m.content) {
          apiMessages.push({
            role: m.role,
            content: m.content
          });
        }
      });
    }

    // إضافة الرسالة الحالية
    apiMessages.push({ role: 'user', content: message });

    // الاتصال بـ OpenRouter مع وقت انتظار محدد
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 ثانية مهلة داخلية

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tia-system.vercel.app',
        'X-Title': 'TIA Production System'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.3,
        max_tokens: 1500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", errorData);
      return { answer: "🌐 عذراً، واجهت مشكلة في الاتصال بالعقل الاصطناعي حالياً. يرجى إعادة المحاولة." };
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;
    
    return { 
      answer: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً. هل يمكنني مساعدتك في شيء آخر؟' 
    };

  } catch (error: any) {
    console.error("askAssociationAssistant Global Error:", error);
    if (error.name === 'AbortError') {
      return { answer: "⏳ استغرق الطلب وقتاً أطول من المعتاد. يرجى المحاولة مرة أخرى." };
    }
    return { 
      answer: "❌ حدث خطأ غير متوقع في النظام الذكي. يرجى المحاولة لاحقاً." 
    };
  }
}
