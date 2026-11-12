'use server';
/**
 * @fileOverview المساعد الذكي الشامل لنظام إنتاج الجمعية النسيجية.
 * يقوم بجلب البيانات الحية من Firestore وتحليلها باستخدام Gemma 2 عبر OpenRouter.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// تهيئة الفايربيز للسيرفر
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

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
 * دالة لجلب ملخص شامل لبيانات النظام
 */
async function getSystemContext() {
  try {
    const [ordersSnap, materialsSnap, productsSnap, workersSnap, vouchersSnap] = await Promise.all([
      getDocs(collection(db, 'productionOrders')),
      getDocs(collection(db, 'materials')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'workers')),
      getDocs(collection(db, 'vouchers'))
    ]);

    const activeOrders = ordersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((o: any) => o.status === 'active' || o.status === 'completed');

    const materials = materialsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((m: any) => m.status !== 'deleted');

    const workers = workersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((w: any) => w.status !== 'deleted');

    const vouchers = vouchersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((v: any) => v.status !== 'deleted');

    // حساب إجماليات مالية
    const totalWages = vouchers
      .filter((v: any) => v.type === 'production_receipt')
      .reduce((sum, v: any) => sum + (v.wageAmount || 0), 0);

    const totalCosts = vouchers
      .filter((v: any) => v.type === 'overhead_cost')
      .reduce((sum, v: any) => sum + (v.totalAmount || 0), 0);

    return `
سياق النظام الحالي (بيانات حقيقية مستخرجة الآن):
1. أوامر الإنتاج: يوجد ${activeOrders.length} أمر (نشط/مكتمل). أهمها: ${activeOrders.slice(0, 5).map((o: any) => `${o.orderNumber}: ${o.title} (منجز: ${o.completedQty}/${o.targetQty})`).join(' | ')}.
2. المخزون والمواد: يوجد ${materials.length} صنف. المواد منخفضة المخزون: ${materials.filter((m: any) => (m.currentQty || 0) <= (m.minQty || 0)).map((m: any) => `${m.nameAr} (${m.currentQty} ${m.unit})`).join(', ')}.
3. القوى العاملة: لدينا ${workers.length} موظف مسجل. المشرفين: ${workers.filter((w: any) => w.isSupervisor).map((w: any) => w.fullName).join(', ')}.
4. المالية والتقارير: إجمالي الأجور المستحقة الموثقة بالسندات: ${totalWages} ريال. إجمالي المصاريف التشغيلية: ${totalCosts} ريال.
5. المرتجعات: تم تسجيل ${vouchers.filter((v: any) => v.type === 'material_return').length} عملية توريد مرتجع.
`;
  } catch (error) {
    console.error("Error fetching context:", error);
    return "لا يمكن الوصول للبيانات الحية حالياً.";
  }
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return { answer: "⚠️ عذراً، مفتاح API غير مهيأ." };
    }

    const dynamicContext = await getSystemContext();

    const systemContent = `أنت "مساعد الإنتاج الأول" لجمعية الصناعات النسيجية بالروضة.
هويتك: خبير تقني ومالي وإداري، وظيفتك مساعدة المدير في اتخاذ القرارات بناءً على البيانات.

قواعد الرد:
1. الدقة: استخدم الأرقام المذكورة في "سياق النظام" للإجابة. إذا سألك عن أمر معين، ابحث عنه في القائمة المذكورة.
2. التقارير: إذا طُلب منك تقرير، استخدم جداول Markdown.
3. التحليل: حلل التكاليف (أجور + مواد + مصاريف) وقارنها بالإنتاج.
4. المخزون: نبه دائماً للمواد التي أوشكت على النفاد.
5. المرتجعات: تتبع المرتجعات لضمان عدم هدر المواد.
6. لا تهلوس: إذا لم تجد معلومة محددة (مثل اسم عامل معين غير موجود في القائمة)، قل "لم أجد هذا السجل في قاعدة البيانات الحالية".

${dynamicContext}

معلومات عامة عن الجمعية:
- التأسيس: 1973م. المقر: الروضة، شبوة. الفروع: عتق، شبوة مول.
- نظام الإنتاج: تكاليف المراحل (Process Costing) والأجر بالقطعة.
- المنتجات: (ملكي، حليسي، بيضاني، سلاطيني، شبواني).

تواصل: واتساب الإدارة: 777263091.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    if (history && Array.isArray(history)) {
      history.slice(-10).forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        let textContent = "";
        if (typeof m.content === 'string') textContent = m.content;
        else if (Array.isArray(m.content)) textContent = m.content[0]?.text || "";
        else textContent = m.text || "";

        if (textContent) apiMessages.push({ role, content: textContent });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tia-system.vercel.app',
        'X-Title': 'TIA Intelligent Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.2, // تقليل درجة الحرارة لزيادة الدقة ومنع الهلوسة
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      return { answer: "🌐 عذراً، هناك مشكلة في الاتصال بالخادم." };
    }

    const data = await response.json();
    return { 
      answer: data.choices?.[0]?.message?.content || 'أعتذر، لم أتمكن من صياغة رد حالياً.' 
    };

  } catch (error: any) {
    console.error("askAssociationAssistant Error:", error);
    return { answer: "❌ حدث خطأ في النظام الذكي." };
  }
}
