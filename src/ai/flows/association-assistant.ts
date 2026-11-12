'use server';
/**
 * @fileOverview المساعد الذكي التنفيذي المطور لنظام إنتاج الجمعية النسيجية.
 * تم منح المساعد صلاحيات وصول كاملة لكافة جداول البيانات (Firestore) لضمان تحليل دقيق وشامل.
 * المساعد ملزم ببروتوكول عرض HTML صارم لمنع رموز الماركداون.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// تهيئة Firebase في بيئة السيرفر
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const AssistantInputSchema = z.object({
  message: z.string().describe('رسالة المستخدم'),
  history: z.array(z.any()).optional().describe('تاريخ المحادثة'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي بصيغة HTML'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

/**
 * دالة جلب البيانات الشاملة من كافة الجداول ومعالجتها مسبقاً لسهولة الفهم من قبل الـ AI
 */
async function getFullSystemSnapshot() {
  const collections = [
    'productionOrders', 'materials', 'workers', 'vouchers', 
    'products', 'finishedGoodsWarehouse', 'departments'
  ];
  
  const rawData: Record<string, any[]> = {};
  
  // جلب البيانات من كل جدول - تم تقليل ليميت السندات لسرعة الاستجابة
  await Promise.all(collections.map(async (colName) => {
    try {
      let q;
      if (colName === 'vouchers') {
        q = query(collection(db, colName), orderBy('date', 'desc'), limit(100));
      } else {
        q = collection(db, colName);
      }
      const snap = await getDocs(q);
      rawData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    } catch (e) {
      console.error(`Error fetching ${colName}:`, e);
      rawData[colName] = [];
    }
  }));

  // --- 1. معالجة بيانات العمال والأقسام ---
  const workersContext = rawData.workers.map(w => {
    const dept = rawData.departments.find(d => d.id === w.departmentId)?.nameAr || 'غير محدد';
    const sup = rawData.workers.find(s => s.id === w.supervisorId)?.fullName || 'لا يوجد';
    return `- ${w.fullName} (${w.workerId}): القسم [${dept}] | الرتبة: [${w.isSupervisor ? 'مشرف' : 'حرفي'}] | المشرف المباشر: [${sup}] | نشط: [${w.active ? 'نعم' : 'لا'}]`;
  }).join('\n');

  // --- 2. معالجة المخزون (المواد الخام) ---
  const materialsContext = rawData.materials.map(m => {
    const status = (m.currentQty || 0) <= (m.minQty || 0) ? '🔴 منخفض!' : '✅ جيد';
    return `- ${m.nameAr} (${m.code}): الرصيد [${m.currentQty} ${m.unit}] | حد الأمان: [${m.minQty}] | السعر: [${m.price} ${m.currency || 'YER'}] | الحالة: ${status}`;
  }).join('\n');

  // --- 3. معالجة أوامر الإنتاج (WIP) ---
  const ordersContext = rawData.productionOrders.filter(o => o.status !== 'deleted').map(o => {
    const p = rawData.products.find(prod => prod.id === o.productId)?.nameAr || 'غير معروف';
    const progress = Math.round(((o.completedQty || 0) / (o.targetQty || 1)) * 100);
    return `- [${o.orderNumber}]: ${o.title} | المنتج: ${p} | المستهدف: ${o.targetQty} | المنجز النهائي: ${o.completedQty} | التقدم: ${progress}% | الحالة: ${o.status}`;
  }).join('\n');

  // --- 4. جرد مستودع المنجز الجاهز ---
  const finishedGoodsContext = rawData.finishedGoodsWarehouse.map(d => {
    const p = rawData.products.find(prod => prod.id === d.id);
    return `- ${p?.nameAr || 'صنف غير معروف'}: الرصيد الجاهز للبيع [${d.totalQty || 0}] قطعة`;
  }).join('\n');

  // --- 5. تحليل إنتاجية العمال (تجميع من سندات الاستلام) ---
  const workerStats: Record<string, number> = {};
  rawData.vouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted').forEach(v => {
    if (v.workerId) {
      workerStats[v.workerId] = (workerStats[v.workerId] || 0) + (v.qtyAccepted || 0);
    }
  });
  const productivityContext = Object.entries(workerStats).map(([wid, qty]) => {
    const w = rawData.workers.find(worker => worker.id === wid);
    return `- ${w?.fullName || 'غير معروف'}: إجمالي المنجز المقبول [${qty}] قطعة`;
  }).sort((a, b) => b.localeCompare(a)).join('\n');

  // --- 6. تفاصيل السندات (آخر 100 حركة) ---
  const vouchersContext = rawData.vouchers.slice(0, 100).map(v => {
    const worker = rawData.workers.find(w => w.id === v.workerId)?.fullName || v.recipient || '---';
    const items = v.items?.map((i: any) => `${i.nameAr}(${i.qty}${i.unit})`).join(', ') || 'لا توجد أصناف';
    const impact = v.type === 'production_receipt' ? `منجز:${v.qtyAccepted} قطعة` : `قيمة:${v.totalAmount || v.wageAmount} ريال`;
    return `- سند [${v.voucherNumber}] | نوع: [${v.type}] | تاريخ: [${v.date}] | للطرف: [${worker}] | التأثير: [${impact}] | الأصناف المشمولة: [${items}]`;
  }).join('\n');

  // --- 7. الملخص المالي العام ---
  const totalWages = rawData.vouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
  const totalExpenses = rawData.vouchers.filter(v => v.type === 'overhead_cost' && v.status !== 'deleted').reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  return `
=== البيانات الحية والنهائية للنظام (حقائق مطلقة) ===

[1. القوى العاملة والأقسام]:
${workersContext || 'لا يوجد عمال مسجلين'}

[2. إنتاجية العمال (تراكمي)]:
${productivityContext || 'لا توجد بيانات إنتاجية'}

[3. المخازن - المواد الخام]:
${materialsContext || 'لا توجد مواد خام'}

[4. المستودع - منتجات جاهزة للبيع]:
${finishedGoodsContext || 'المستودع فارغ'}

[5. أوامر الإنتاج والعمليات الجارية]:
${ordersContext || 'لا توجد أوامر نشطة'}

[6. سجل السندات التاريخي (التفاصيل العميقة)]:
${vouchersContext || 'لا توجد سندات مؤرشفة'}

[7. الملخص المالي التراكمي]:
- إجمالي الأجور المستحقة (غير المصروفة): ${totalWages} ريال يمني
- إجمالي المصاريف التشغيلية (كهرباء، نقل، إلخ): ${totalExpenses} ريال يمني
=================================================`;
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return { answer: "<h3>⚠️ تنبيه إداري</h3><p>محرك الذكاء الاصطناعي غير مهيأ. يرجى مراجعة إعدادات مفتاح الـ API.</p>" };

    // جلب لقطة البيانات الحية المحدثة
    const liveContext = await getFullSystemSnapshot();

    const systemContent = `أنت "المستشار التنفيذي الذكي" لجمعية الصناعات النسيجية بـ "الروضة - شبوة".
مهمتك: تحليل البيانات الحية المرفقة لك بدقة متناهية وتقديم إجابات قاطعة، إحصائية، ورقابية فورية للمدير.

البيانات التالية هي "الحقيقة المطلقة" للنظام الآن (لا تطلب بيانات أخرى):
${liveContext}

قواعد السلوك والرد (صارمة جداً):
1. كن مختصراً جداً ومباشراً في إجاباتك لسرعة التنفيذ. قدم الأرقام والجداول فوراً دون مقدمات طويلة.
2. التنسيق: استخدم لغة HTML حصراً. يُمنع استخدام Markdown نهائياً.
3. الجداول: أي بيانات مقارنة يجب عرضها في جدول HTML منسق كالتالي:
   <table style="width:100%; border-collapse: collapse; text-align: right; margin: 15px 0; font-family: sans-serif; font-size: 13px;">
   <tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #ddd;">...</th></tr>
   <tr><td style="padding: 10px; border: 1px solid #ddd;">...</td></tr>
   </table>
4. الهوية: أنت لست بوت دردشة، أنت "لوحة تحكم ناطقة". ردودك يجب أن تكون موجهة للمدير بلهجة احترافية وسريعة.
5. الذكاء التحليلي: ابحث في سجل السندات وتفاصيل الأصناف بدقة لتوليد التقارير.
6. الأرقام: اعرض المبالغ والكميات بوضوح وبصيغة الأرقام الإنجليزية (1,234) متبوعة بالوحدة.

استخدم <h3> للعناوين و <p> للنصوص و <strong> للتمييز. ابدأ الإجابة بالمعلومات المطلوبة مباشرة.`;

    const apiMessages: any[] = [{ role: 'system', content: systemContent }];

    if (history && Array.isArray(history)) {
      history.slice(-15).forEach(m => {
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
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.1, 
        max_tokens: 2000
      })
    });

    if (!response.ok) return { answer: "<h3>🌐 خطأ في الاتصال</h3><p>عذراً يا مدير، هناك ضغط على محرك التحليل السحابي. يرجى المحاولة مرة أخرى.</p>" };

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'أعتذر، لم أستطع استخلاص النتائج حالياً.';
    
    answer = answer.replace(/```html/g, '').replace(/```/g, '');
    
    return { answer };

  } catch (error: any) {
    console.error("Assistant Flow Error:", error);
    return { answer: "<h3>❌ خطأ فني</h3><p>حدث فشل في قراءة السجلات الحية لقاعدة البيانات.</p>" };
  }
}
