'use server';
/**
 * @fileOverview المساعد الذكي التنفيذي لنظام إنتاج الجمعية النسيجية.
 * يقوم المساعد بتحليل كامل قاعدة بيانات Firestore وتقديم تقارير دقيقة للمدير.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
 * دالة جلب البيانات الحية وتحويلها إلى سياق نصي شامل للموديل
 */
async function getFullSystemData() {
  try {
    const [ordersSnap, materialsSnap, workersSnap, vouchersSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'productionOrders')),
      getDocs(collection(db, 'materials')),
      getDocs(collection(db, 'workers')),
      getDocs(collection(db, 'vouchers')),
      getDocs(collection(db, 'products'))
    ]);

    // 1. معالجة أوامر الإنتاج
    const orders = ordersSnap.docs.map(d => {
      const data = d.data();
      return `- أمر [${data.orderNumber}]: ${data.title} | المنتج: ${data.productId} | المستهدف: ${data.targetQty} | المنجز النهائي: ${data.completedQty} | الحالة: ${data.status}`;
    }).filter(o => !o.includes('deleted')).join('\n');

    // 2. معالجة المخزون
    const materials = materialsSnap.docs.map(d => {
      const data = d.data();
      const isLow = (data.currentQty || 0) <= (data.minQty || 0);
      return `- ${data.nameAr} (${data.code}): الرصيد الحالي [${data.currentQty} ${data.unit}] | حد الأمان: ${data.minQty} ${isLow ? '⚠️ مخزون منخفض' : ''}`;
    }).filter(m => !m.includes('deleted')).join('\n');

    // 3. معالجة القوى العاملة
    const workers = workersSnap.docs.map(d => {
      const data = d.data();
      return `- ${data.fullName} (${data.workerId}): ${data.isSupervisor ? 'مشرف' : 'حرفي'} | نشط: ${data.active ? 'نعم' : 'لا'}`;
    }).filter(w => !w.includes('deleted')).join('\n');

    // 4. معالجة المالية (السندات)
    const allVouchers = vouchersSnap.docs.map(d => d.data()).filter(v => v.status !== 'deleted');
    const totalWages = allVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const totalExpenses = allVouchers.filter(v => v.type === 'overhead_cost').reduce((sum, v) => sum + (v.totalAmount || 0), 0);
    const materialIssues = allVouchers.filter(v => v.type === 'material_issue').length;
    const materialReturns = allVouchers.filter(v => v.type === 'material_return').length;

    return `
=== قاعدة البيانات الحية (حدثت الآن) ===

[أوامر الإنتاج النشطة والمكتملة]:
${orders || 'لا توجد أوامر حالياً.'}

[سجل المواد الخام والمخزون]:
${materials || 'لا توجد مواد مسجلة.'}

[قائمة الموظفين والعمال]:
${workers || 'لا يوجد عمال مسجلون.'}

[الملخص المالي والعمليات]:
- إجمالي الأجور المستحقة (من واقع سندات الاستلام): ${totalWages} ريال.
- إجمالي المصاريف التشغيلية (كهرباء، إيجار، إلخ): ${totalExpenses} ريال.
- عمليات صرف المواد: ${materialIssues} عملية.
- عمليات توريد المرتجعات: ${materialReturns} عملية.
====================================
`;
  } catch (error) {
    console.error("Error fetching full data:", error);
    return "خطأ: تعذر جلب البيانات الحية من قاعدة البيانات.";
  }
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return { answer: "⚠️ عذراً، مفتاح OpenRouter غير مهيأ في السيرفر." };
    }

    // جلب البيانات الحية ووضعها في السياق
    const liveContext = await getFullSystemData();

    const systemContent = `أنت "المساعد التنفيذي الأول" لجمعية الصناعات النسيجية بالروضة. 
وظيفتك: تحليل البيانات الحية المقدمة لك والإجابة على استفسارات المدير بدقة متناهية.

قواعد صارمة للتعامل:
1. أنت تملك وصولاً كاملاً للبيانات المذكورة في "قاعدة البيانات الحية" أدناه. لا تقل أبداً "لا يمكنني الوصول" أو "أحتاج لمعلومات".
2. استخدم الأرقام الحقيقية المذكورة في السياق فقط. إذا سألك عن مخزون "الخيوط"، ابحث عنها في قائمة المواد وأعطه الرقم بدقة.
3. التنسيق: استخدم جداول Markdown لعرض الإحصائيات والقوائم الطويلة. استخدم الترقيم والنقاط بوضوح.
4. الذكاء السياقي: تذكر ما قاله المدير سابقاً. إذا سأل عن "العمال" ثم قال "كم أجورهم؟"، فإنه يقصد إجمالي الأجور المذكور في الملخص المالي.
5. الهوية: أنت خبير إداري ومالي، ردودك مهنية، واثقة، ومختصرة ومفيدة.
6. إذا لم تجد معلومة محددة (مثل اسم عامل غير موجود في القائمة)، قل: "لم أجد هذا الاسم في السجلات الحالية المتاحة لي".

${liveContext}

معلومات تاريخية عن الجمعية:
- التأسيس: 1973م بالروضة، شبوة.
- التخصص: حياكة المعاوز اليدوية (ملكي، حليسي، بيضاني، سلاطيني، شبواني).
- نظام الإنتاج: تكاليف المراحل (Process Costing) والأجر بالقطعة.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة التاريخ لضمان الذاكرة الموقوتة
    if (history && Array.isArray(history)) {
      history.slice(-10).forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        let textContent = m.content || m.text || "";
        if (textContent) apiMessages.push({ role, content: textContent });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'TIA Executive Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.1, // تقليل الحرارة لأقصى درجة لضمان الدقة ومنع الهلوسة
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      return { answer: "🌐 عذراً، هناك مشكلة في الاتصال بمحرك الذكاء الاصطناعي." };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'أعتذر، لم أتمكن من استخلاص الإجابة.';
    
    return { answer };

  } catch (error: any) {
    console.error("askAssociationAssistant Error:", error);
    return { answer: "❌ حدث خطأ فني أثناء معالجة البيانات." };
  }
}
