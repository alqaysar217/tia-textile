'use server';
/**
 * @fileOverview المساعد الذكي التنفيذي المطور لنظام إنتاج الجمعية النسيجية.
 * تم تحويل مخرجات المساعد بالكامل إلى HTML نظيف لضمان عرض احترافي للجداول والتقارير.
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
  answer: z.string().describe('إجابة المساعد الذكي بصيغة HTML'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

/**
 * دالة جلب البيانات الحية المتقدمة
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

    const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const allWorkers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // 1. أوامر الإنتاج
    const orders = ordersSnap.docs.map(d => {
      const data = d.data();
      const p = (allProducts.find(prod => prod.id === data.productId))?.nameAr || 'غير معروف';
      return `- [${data.orderNumber}]: ${data.title} | المنتج: ${p} | المستهدف: ${data.targetQty} | المنجز: ${data.completedQty} | الحالة: ${data.status}`;
    }).filter(o => !o.includes('deleted')).join('\n');

    // 2. المخزون
    const materials = materialsSnap.docs.map(d => {
      const data = d.data();
      return `- ${data.nameAr} (${data.code}): الرصيد [${data.currentQty} ${data.unit}] | حد الأمان: ${data.minQty}`;
    }).filter(m => !m.includes('deleted')).join('\n');

    // 3. العمال
    const workersList = allWorkers.map(w => `- ${w.fullName} (${w.workerId}): ${w.isSupervisor ? 'مشرف' : 'حرفي'} | نشط: ${w.active ? 'نعم' : 'لا'}`).join('\n');

    // 4. السندات التفصيلية
    const allVouchers = vouchersSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).filter(v => v.status !== 'deleted');
    const vouchersDetail = allVouchers.slice(0, 40).map(v => {
      const items = v.items?.map((i: any) => `${i.nameAr}(${i.qty}${i.unit})`).join(', ') || '';
      const recipient = allWorkers.find(w => w.id === v.workerId)?.fullName || v.recipient || '---';
      return `- سند [${v.voucherNumber}] نوع [${v.type}] تاريخ [${v.date}] مستلم [${recipient}] أصناف: [${items}]`;
    }).join('\n');

    // 5. جرد المستودع
    const warehouseInv = warehouseSnap.docs.map(d => {
      const p = allProducts.find(prod => prod.id === d.id);
      return `- ${p?.nameAr || 'صنف غير معرف'}: ${d.data().totalQty || 0} قطعة جاهزة`;
    }).join('\n');

    // 6. الملخص المالي
    const totalWages = allVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const totalExpenses = allVouchers.filter(v => v.type === 'overhead_cost').reduce((sum, v) => sum + (v.totalAmount || 0), 0);

    return `
=== قاعدة البيانات الحية ===
[أوامر الإنتاج]: ${orders}
[المخزن]: ${materials}
[المستودع]: ${warehouseInv}
[العمال]: ${workersList}
[السندات]: ${vouchersDetail}
[المالية]: أجور ${totalWages} ، مصاريف ${totalExpenses}
==========================`;
  } catch (error) {
    return "خطأ في جلب البيانات.";
  }
}

export async function askAssociationAssistant(input: AssistantInput): Promise<AssistantOutput> {
  try {
    const { message, history } = input;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return { answer: "<p>⚠️ مفتاح الوصول غير مهيأ.</p>" };

    const liveContext = await getFullSystemData();

    const systemContent = `أنت مساعد ذكي متخصص في تحليل وإدارة بيانات مصانع النسيج وإنتاج المعاوز التابع لجمعية الصناعات النسيجية بالروضة.
وظيفتك: تحليل البيانات الحية المقدمة لك وتقديم تقارير دقيقة ومبهرة للمدير.

البيانات الحية المتاحة حالياً من النظام:
${liveContext}

عند الرد، التزم بصرامة بقواعد التنسيق التالية لعرض الإجابة في واجهة الويب:
1. يُمنع منعاً باتاً استخدام رموز Markdown مثل (#، *، **، |، ---، \`\`\`).
2. اكتب جميع ردودك بصيغة كود HTML نظيف وجاهز للعرض مباشرة داخل صفحة الويب.
3. استخدم الوسوم التالية فقط للتنسيق:
   - للعناوين الرئيسية والفرعية: استخدم <h3> و <h4>.
   - للنص العادي: استخدم <p>.
   - للنص الغامق (المهم): استخدم <strong>.
   - للقوائم المرقمة: استخدم <ol> و <li>.
   - للقوائم النقطية: استخدم <ul> و <li>.
   - للجداول: استخدم <table> مع <thead> و <tbody> و <tr> و <th> و <td>.
   - تنسيق الجداول إلزامي: أضف للوسم <table> خاصية style="width:100%; border-collapse: collapse; text-align: right; margin: 10px 0;" وأضف للخلايا <th> و <td> خاصية style="padding: 8px; border: 1px solid #ddd;".
4. اجعل ردودك مباشرة، احترافية، ومرتبة دون مقدمات أو خواتيم مكررة.
5. لا تقل "لا يمكنني الوصول". البيانات في السياق هي بيانات حية من Firestore.
6. إذا لم تجد معلومة، قل: "لم أعثر على هذا السجل في البيانات الحالية، يرجى التأكد من كتابة الاسم بشكل صحيح".`;

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
      },
      body: JSON.stringify({
        model: 'google/gemma-2-27b-it',
        messages: apiMessages,
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) return { answer: "<p>🌐 مشكلة في الاتصال بمحرك الذكاء الاصطناعي.</p>" };

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'لم أتمكن من استخلاص الإجابة.';
    
    return { answer };

  } catch (error: any) {
    return { answer: "<p>❌ حدث خطأ فني أثناء معالجة البيانات.</p>" };
  }
}