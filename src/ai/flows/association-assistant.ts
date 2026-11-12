'use server';
/**
 * @fileOverview المساعد الذكي التنفيذي المطور لنظام إنتاج الجمعية النسيجية.
 * تم منح المساعد صلاحيات وصول كاملة لكافة جداول البيانات (Firestore) لضمان تحليل دقيق وشامل.
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
 * دالة جلب البيانات الشاملة من كافة الجداول
 */
async function getFullSystemSnapshot() {
  const collections = [
    'productionOrders', 'materials', 'workers', 'vouchers', 
    'products', 'finishedGoodsWarehouse', 'departments'
  ];
  
  const rawData: Record<string, any[]> = {};
  
  // جلب البيانات من كل جدول على حدة لضمان عدم توقف النظام إذا فشل أحد الجداول
  await Promise.all(collections.map(async (colName) => {
    try {
      let q;
      if (colName === 'vouchers') {
        q = query(collection(db, colName), orderBy('date', 'desc'), limit(200));
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

  // صياغة سياق معرفي فائق التفصيل للمساعد
  
  // 1. العمال والأقسام
  const workersContext = rawData.workers.map(w => {
    const dept = rawData.departments.find(d => d.id === w.departmentId)?.nameAr || 'غير محدد';
    const sup = rawData.workers.find(s => s.id === w.supervisorId)?.fullName || 'لا يوجد';
    return `- ${w.fullName} (${w.workerId}): القسم [${dept}] | الرتبة: [${w.isSupervisor ? 'مشرف' : 'حرفي'}] | المشرف: [${sup}] | نشط: [${w.active ? 'نعم' : 'لا'}]`;
  }).join('\n');

  // 2. المخزون (المواد الخام)
  const materialsContext = rawData.materials.map(m => {
    return `- ${m.nameAr} (${m.code}): الرصيد الحالي [${m.currentQty} ${m.unit}] | حد الأمان: [${m.minQty}] | السعر: [${m.price} ${m.currency}]`;
  }).join('\n');

  // 3. أوامر الإنتاج (WIP)
  const ordersContext = rawData.productionOrders.map(o => {
    const p = rawData.products.find(prod => prod.id === o.productId)?.nameAr || 'غير معروف';
    const progress = Math.round(((o.completedQty || 0) / (o.targetQty || 1)) * 100);
    return `- [${o.orderNumber}]: ${o.title} | المنتج: ${p} | المستهدف: ${o.targetQty} | المنجز: ${o.completedQty} | التقدم: ${progress}% | الحالة: ${o.status}`;
  }).filter(o => !o.includes('deleted')).join('\n');

  // 4. مستودع المنجز الجاهز
  const finishedGoodsContext = rawData.finishedGoodsWarehouse.map(d => {
    const p = rawData.products.find(prod => prod.id === d.id);
    return `- ${p?.nameAr || 'صنف غير معرف'}: الرصيد الجاهز [${d.totalQty || 0}] قطعة`;
  }).join('\n');

  // 5. تحليل السندات الأخيرة (آخر 50 حركة تفصيلية)
  const vouchersContext = rawData.vouchers.slice(0, 50).map(v => {
    const worker = rawData.workers.find(w => w.id === v.workerId)?.fullName || v.recipient || '---';
    const items = v.items?.map((i: any) => `${i.nameAr}(${i.qty}${i.unit})`).join(', ') || 'لا توجد أصناف';
    return `- سند [${v.voucherNumber}] نوع [${v.type}] تاريخ [${v.date}] بمبلغ/كمية [${v.totalAmount || v.qtyAccepted}] للعامل [${worker}] الأصناف المشمولة: [${items}]`;
  }).join('\n');

  // 6. الملخص المالي العام
  const totalWages = rawData.vouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
  const totalExpenses = rawData.vouchers.filter(v => v.type === 'overhead_cost' && v.status !== 'deleted').reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  return `
=== لقطة حية لقاعدة البيانات (Snapshot) ===
[القوى العاملة]:
${workersContext || 'لا يوجد عمال مسجلين'}

[المخازن - مواد خام]:
${materialsContext || 'لا توجد مواد خام'}

[المستودع - منتجات جاهزة للبيع]:
${finishedGoodsContext || 'المستودع فارغ'}

[أوامر الإنتاج والعمليات]:
${ordersContext || 'لا توجد أوامر نشطة'}

[أحدث السندات المالية والمخزنية]:
${vouchersContext || 'لا توجد سندات مؤرشفة'}

[الملخص المالي التراكمي]:
- إجمالي الأجور المستحقة: ${totalWages} ريال
- إجمالي المصاريف التشغيلية: ${totalExpenses} ريال
==========================================`;
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return { answer: "<p>⚠️ عذراً يا مدير، محرك الذكاء الاصطناعي غير مهيأ (مفتاح الـ API مفقود).</p>" };

    // جلب البيانات الحية قبل إرسال الطلب
    const liveContext = await getFullSystemSnapshot();

    const systemContent = `أنت "المستشار التنفيذي الذكي" والمساعد الأول لمدير مصانع نسيج المعاوز بجمعية الروضة.
مهمتك: تحليل لقطة البيانات الحية المرفقة لك بدقة فائقة وتقديم تقارير تحليلية، إحصائية، ورقابية فورية.

البيانات الحية المتاحة بين يديك الآن (هذه هي الحقيقة المطلقة للنظام):
${liveContext}

قواعد صارمة للتعامل مع البيانات:
1. ممنوع منعاً باتاً قول "لا يمكنني الوصول للبيانات" أو "أحتاج لمعلومات إضافية". البيانات موجودة في الفقرة السابقة بالكامل.
2. إذا سألك المدير عن مادة في سند، ابحث في "أحدث السندات" وفي حقل "الأصناف المشمولة" وستجدها.
3. عند تقديم تقارير، استخدم لغة HTML حصراً وجداول منسقة كالتالي:
   - للجدول: <table style="width:100%; border-collapse: collapse; text-align: right; margin: 10px 0; font-size: 13px;">
   - للخلايا: <th/td style="padding: 8px; border: 1px solid #ddd;">
4. كن ذكياً في الاستنتاج: إذا كان رصيد مادة أقل من حد الأمان، نبه المدير فوراً. إذا كان هناك أمر إنتاج متعثر (نسبة إنجازه منخفضة وتاريخه قديم)، أشر إليه.
5. لا تستخدم رموز Markdown نهائياً (#، *، **، إلخ).
6. اجعل ردودك موجهة للمدير بلهجة احترافية، سريعة، وعملية.

الهوية: أنت لست مجرد بوت، أنت "عقل النظام" الذي يرى كل حركة مخزنية ومالية.`;

    const apiMessages: any[] = [{ role: 'system', content: systemContent }];

    // إرسال تاريخ المحادثة لضمان فهم السياق (الذاكرة المؤقتة)
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
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.1, // لضمان أقصى درجات الدقة والالتزام بالبيانات
        max_tokens: 3000
      })
    });

    if (!response.ok) return { answer: "<p>🌐 عذراً، هناك ضغط على محرك التحليل، يرجى المحاولة بعد لحظات.</p>" };

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'أعتذر، لم أستطع استخلاص النتائج حالياً.';
    
    return { answer };

  } catch (error: any) {
    console.error("Assistant Flow Error:", error);
    return { answer: "<p>❌ حدث خطأ فني أثناء قراءة سجلات النظام الحية.</p>" };
  }
}
