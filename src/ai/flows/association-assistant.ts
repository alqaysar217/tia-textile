'use server';
/**
 * @fileOverview المساعد الذكي التنفيذي المطور لنظام إنتاج الجمعية النسيجية.
 * تم تحسينه لسحب تفاصيل الأصناف داخل السندات وتحليل الإنتاجية المالية والوظيفية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

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
 * دالة جلب البيانات الحية المتقدمة (تشمل تفاصيل الأصناف داخل السندات)
 */
async function getFullSystemData() {
  try {
    const [ordersSnap, materialsSnap, workersSnap, vouchersSnap, productsSnap, warehouseSnap] = await Promise.all([
      getDocs(collection(db, 'productionOrders')),
      getDocs(collection(db, 'materials')),
      getDocs(collection(db, 'workers')),
      getDocs(query(collection(db, 'vouchers'), orderBy('date', 'desc'), limit(150))),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'finishedGoodsWarehouse'))
    ]);

    // 1. معالجة أوامر الإنتاج
    const orders = ordersSnap.docs.map(d => {
      const data = d.data();
      const p = (allProducts.find(prod => prod.id === data.productId))?.nameAr || 'غير معروف';
      return `- [${data.orderNumber}]: ${data.title} | المنتج: ${p} | المستهدف: ${data.targetQty} | المنجز: ${data.completedQty} | الحالة: ${data.status}`;
    }).filter(o => !o.includes('deleted')).join('\n');

    // 2. معالجة المخزون (مواد خام)
    const materials = materialsSnap.docs.map(d => {
      const data = d.data();
      return `- ${data.nameAr} (${data.code}): الرصيد [${data.currentQty} ${data.unit}] | حد الأمان: ${data.minQty}`;
    }).filter(m => !m.includes('deleted')).join('\n');

    // 3. معالجة القوى العاملة
    const allWorkers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const workersList = allWorkers.map(w => `- ${w.fullName} (${w.workerId}): ${w.isSupervisor ? 'مشرف' : 'حرفي'} | نشط: ${w.active ? 'نعم' : 'لا'}`).join('\n');

    // 4. معالجة السندات بالتفصيل (البحث عن مادة معينة)
    const allVouchers = vouchersSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(v => v.status !== 'deleted');
    const vouchersDetail = allVouchers.slice(0, 40).map(v => {
      const items = v.items?.map((i: any) => `${i.nameAr}(${i.qty}${i.unit})`).join(', ') || '';
      const recipient = allWorkers.find(w => w.id === v.workerId)?.fullName || v.recipient || '---';
      return `- سند [${v.voucherNumber}] نوع [${v.type}] تاريخ [${v.date}] مستلم [${recipient}] أصناف: [${items}]`;
    }).join('\n');

    // 5. جرد مستودع المنجز الجاهز
    const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const warehouseInv = warehouseSnap.docs.map(d => {
      const p = allProducts.find(prod => prod.id === d.id);
      return `- ${p?.nameAr || 'صنف غير معرف'}: ${d.data().totalQty || 0} قطعة جاهزة`;
    }).join('\n');

    // 6. ملخص مالي
    const totalWages = allVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const totalExpenses = allVouchers.filter(v => v.type === 'overhead_cost').reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    return `
=== قاعدة البيانات الحية (تحديث لحظي) ===

[أوامر الإنتاج (WIP)]:
${orders || 'لا توجد أوامر حالياً.'}

[مخزن المواد الخام]:
${materials || 'لا توجد مواد.'}

[مستودع المنتجات الجاهزة للبيع]:
${warehouseInv || 'المستودع فارغ.'}

[سجل الموظفين والعمال]:
${workersList || 'لا يوجد عمال.'}

[آخر 40 سند (تفصيلي)]:
${vouchersDetail}

[الملخص المالي]:
- إجمالي الأجور المستحقة (من السندات): ${totalWages} ريال.
- إجمالي المصاريف التشغيلية (كهرباء، إيجار، إلخ): ${totalExpenses} ريال.
====================================
`;
  } catch (error) {
    console.error("Error fetching full data:", error);
    return "خطأ: تعذر جلب البيانات الحية.";
  }
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) return { answer: "⚠️ مفتاح OpenRouter غير مهيأ." };

    const liveContext = await getFullSystemData();

    const systemContent = `أنت "المساعد التنفيذي الأول" لجمعية الصناعات النسيجية بالروضة. 
وظيفتك: تحليل البيانات الحية المقدمة لك وتقديم تقارير دقيقة ومبهرة للمدير.

مهامك الفائقة:
1. جلب تفاصيل أي سند: إذا سألك المدير عن مادة معينة (مثل "خيوط قطن")، ابحث في قائمة "السندات التفصيلية" وأخبره بأرقام السندات التي وردت فيها وتواريخها والمستلم.
2. تحليل الإنتاجية: يمكنك تحديد أفضل عامل من خلال مراجعة سندات "production_receipt" والكميات المسجلة.
3. حالة المخزون: أعطه الأرقام بدقة من "مخزن المواد الخام" أو "مستودع المنتجات الجاهزة".
4. تلخيص الأوامر: حلل أي أمر إنتاج، كم المتبقي له (المستهدف - المنجز) وما هي حالته.
5. المالية: احسب التكاليف الإجمالية بناءً على المصاريف والأجور المذكورة.

قواعد صارمة:
- لا تقل "لا يمكنني الوصول". البيانات في "السياق" هي بيانات حية من Firestore.
- استخدم جداول Markdown لعرض أي قوائم (عمال، مخزون، تكاليف).
- كن دقيقاً جداً في الأرقام؛ لا تزيد ولا تنقص.
- إذا لم تجد معلومة، قل: "لم أعثر على هذا السجل في البيانات الحالية، يرجى التأكد من كتابة الاسم بشكل صحيح".

${liveContext}

معلومات تاريخية عن الجمعية:
- التأسيس: 1973م بالروضة، شبوة.
- التخصص: حياكة المعاوز اليدوية (ملكي، حليسي، بيضاني، سلاطيني، شبواني).
- نظام الإنتاج: تكاليف المراحل (Process Costing) والأجر بالقطعة.`;

    const apiMessages: any[] = [{ role: 'system', content: systemContent }];

    if (history && Array.isArray(history)) {
      history.slice(-10).forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        apiMessages.push({ role, content: m.content || m.text || "" });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'TIA Executive Intelligence'
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) return { answer: "🌐 مشكلة في الاتصال بمحرك الذكاء الاصطناعي." };

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'أعتذر، لم أتمكن من استخلاص الإجابة.';
    
    return { answer };

  } catch (error: any) {
    console.error("askAssociationAssistant Error:", error);
    return { answer: "❌ حدث خطأ فني أثناء معالجة البيانات." };
  }
}
