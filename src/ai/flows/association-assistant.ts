'use server';
/**
 * @fileOverview مساعد الإنتاج الذكي لجمعية الصناعات النسيجية.
 * تم تحويل المحرك لاستخدام OpenRouter مع نموذج google/gemma-2-27b-it لضمان الاستقرار والمجانية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string().describe('رسالة المستخدم'),
  history: z.array(z.any()).optional().describe('تاريخ المحادثة'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

/**
 * الوظيفة الرئيسية لمعالجة طلبات المساعد الذكي باستخدام OpenRouter.
 */
export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return { answer: "⚠️ عذراً، مفتاح API (OpenRouter) غير مهيأ في إعدادات الخادم." };
    }

    const systemContent = `أنت "مساعد الإنتاج الذكي" لجمعية الصناعات النسيجية بالروضة، محافظة شبوة.
هويتك: مساعد مهني، ودود، وخبير في تراث المعاوز ونظام الإنتاج الخاص بالجمعية.

قواعد الرد الذكي:
1. القوائم: استخدم الترقيم (1. 2. 3.) بوضوح.
2. الجداول: إذا طُلب منك مقارنات أو قوائم طويلة، استخدم جداول Markdown.
3. الهوية: شجع دائماً على الحفاظ على الجودة والهوية التراثية.
4. الروابط: أي رابط يجب أن يوضع في تنسيق: رابط: [الرابط].

معلومات الجمعية الأساسية:
- التأسيس: 1973م.
- المقر: الروضة، شبوة. الفروع: عتق الرئيسي، شبوة مول.
- النظام: الإنتاج بالمراحل (Process Costing) والأجر بالقطعة.
- المنتجات: (ملكي، حليسي، بيضاني، سلاطيني، شبواني).

قواعد الرد:
- أجب باللغة العربية الفصحى المبسطة بلهجة محترمة.
- لا تخمن؛ إذا لم تجد المعلومة، اعتذر بلباقة ووجه المستخدم للإدارة.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // تنسيق التاريخ كما في الكود المرفق لضمان الاستقرار
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        let textContent = "";
        if (typeof m.content === 'string') textContent = m.content;
        else if (Array.isArray(m.content)) textContent = m.content[0]?.text || "";
        else textContent = m.text || "";

        if (textContent) apiMessages.push({ role, content: textContent });
      });
    }

    // إضافة الرسالة الحالية
    apiMessages.push({ role: 'user', content: message });

    // الاتصال بـ OpenRouter
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
      })
    });

    if (!response.ok) {
      return { answer: "🌐 عذراً، واجهت مشكلة في الاتصال بالعقل الاصطناعي حالياً." };
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;
    
    return { 
      answer: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً.' 
    };

  } catch (error: any) {
    console.error("askAssociationAssistant Error:", error);
    return { 
      answer: "❌ حدث خطأ غير متوقع في النظام الذكي. يرجى المحاولة لاحقاً." 
    };
  }
}
