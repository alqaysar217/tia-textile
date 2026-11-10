'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VoucherTemplateProps {
  voucher: any;
  order?: any;
  worker?: any;
  supervisor?: any;
  departments?: any[];
  products?: any[];
  allReceipts?: any[];
  allOrders?: any[];
  allWorkers?: any[];
  lang: string;
}

export function VoucherTemplate({ 
  voucher, 
  order, 
  worker, 
  supervisor, 
  departments, 
  products, 
  allReceipts,
  allOrders,
  allWorkers,
  lang 
}: VoucherTemplateProps) {
  if (!voucher) return null;

  const isRtl = lang === 'ar';

  const costCategories: Record<string, string> = {
    'electricity': 'كهرباء',
    'internet': 'انترنت',
    'maintenance': 'صيانة',
    'spare_parts': 'قطع غيار',
    'rent': 'إيجار',
    'communications': 'اتصالات',
    'transport': 'نقل',
    'marketing': 'تسويق',
    'design': 'تصميم',
    'photography': 'تصوير',
    'training': 'تدريب',
    'services': 'خدمات',
    'other': 'أخرى'
  };

  return (
    <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* WATERMARK LOGO */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
        <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
      </div>

      {/* PROFESSIONAL BILINGUAL HEADER */}
      <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8 relative z-10">
        <div className="text-right space-y-1">
          <h2 className="text-xl font-black text-emerald-900 leading-tight">جمعية الصناعات النسيجية</h2>
          <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
          <p className="text-[11px] font-bold text-slate-400 tabular-nums" dir="ltr">0777 263 091 | nseeg202020@gmail.com</p>
        </div>

        <div className="flex justify-center">
          <div className="w-24 h-24 bg-white border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2 shadow-sm relative overflow-hidden">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="text-left space-y-1" dir="ltr">
          <h2 className="text-[14px] font-black text-emerald-900 uppercase leading-tight tracking-tight">Textile Industries Association</h2>
          <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
          <p className="text-[10px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
        </div>
      </div>

      {/* VOUCHER TITLE BAR */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm ring-4 ring-emerald-50">
          <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">
            {voucher.type === 'material_issue' ? (isRtl ? 'سند صرف مواد خام' : 'Material Issue Voucher') : 
             voucher.type === 'production_receipt' ? (isRtl ? 'سند استلام وتسوية إنتاج' : 'Production Receipt') :
             voucher.type === 'wage_payment' ? (isRtl ? 'سند صرف أجور مالي' : 'Wage Payment Voucher') :
             voucher.type === 'material_return' ? (isRtl ? 'سند توريد مرتجع مخزني' : 'Material Return Voucher') :
             voucher.type === 'overhead_cost' ? (isRtl ? 'سند صرف تكاليف تشغيلية' : 'Overhead Cost Voucher') :
             (isRtl ? 'سند رسمي' : 'Official Voucher')}
          </h3>
        </div>
      </div>

      {/* DATA GRID - 3 COLUMNS */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'المستفيد / المستلم' : 'Recipient'}</span>
            <span className="text-sm font-black text-slate-900">{worker?.fullName || voucher.recipient || '---'}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'التصنيف / القسم' : 'Category'}</span>
            <span className="text-sm font-black text-slate-700">
               {voucher.type === 'overhead_cost' 
                ? (costCategories[voucher.category] || voucher.category)
                : (departments?.find(d => d.id === voucher.currentStageId || d.id === worker?.departmentId)?.nameAr || '---')
               }
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'رقم السند' : 'Voucher No.'}</span>
            <span className="text-sm font-black text-emerald-900 tabular-nums tracking-wider">{voucher.voucherNumber}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'الدفعة المرتبطة' : 'Batch Name'}</span>
            <span className="text-sm font-black text-slate-700 truncate max-w-[150px]">
              {allOrders?.find(o => o.id === voucher.orderId)?.orderNumber || order?.orderNumber || (isRtl ? 'مصروف عام' : 'General')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'تاريخ السند' : 'Date'}</span>
            <span className="text-sm font-black text-slate-700 tabular-nums">{voucher.date}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'المشرف المسؤول' : 'Supervisor'}</span>
            <span className="text-sm font-black text-slate-700">
              {allWorkers?.find(w => w.id === voucher.supervisorId)?.fullName || supervisor?.fullName || (isRtl ? 'إدارة الجمعية' : 'Management')}
            </span>
          </div>
        </div>
      </div>

      {/* ITEMS SECTION */}
      <div className="mb-12 relative z-10">
        {voucher.type === 'production_receipt' ? (
          <div className="space-y-10">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 uppercase">
                {isRtl ? 'أولاً: مخرجات الإنتاج المنجزة' : 'I. FINISHED PRODUCTION OUTPUTS'}
              </h4>
              <Table className="text-right border-2 border-emerald-900/10">
                <TableHeader className="bg-emerald-900/5">
                  <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                    <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{isRtl ? 'نوع المعوز' : 'Item Type'}</TableHead>
                    <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'الكمية المستلمة' : 'Accepted Qty'}</TableHead>
                    <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'أجر القطعة' : 'Wage/Pcs'}</TableHead>
                    <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'الإجمالي' : 'Total'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-white/40">
                    <TableCell className="font-bold text-sm py-5">
                      {products?.find(p => p.id === order?.productId)?.nameAr || '---'}
                    </TableCell>
                    <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">
                      {(voucher.qtyAccepted || 0).toLocaleString('en-US')} {isRtl ? 'قطعة' : 'Pcs'}
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm tabular-nums">
                      {(voucher.wageRate || 0).toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-center font-black text-sm tabular-nums text-emerald-900">
                      {(voucher.wageAmount || 0).toLocaleString('en-US')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {voucher.returnedItems?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-blue-900 border-r-4 border-blue-600 pr-3 uppercase">
                  {isRtl ? 'ثانياً: المواد الخام المرتجعة للمخزن' : 'II. RETURNED RAW MATERIALS'}
                </h4>
                <Table className="text-right border-2 border-blue-900/10">
                  <TableHeader className="bg-blue-900/5">
                    <TableRow className="hover:bg-transparent border-b-2 border-blue-900/20">
                      <TableHead className="text-right font-black text-xs py-4 text-blue-900">{isRtl ? 'اسم المادة' : 'Material Name'}</TableHead>
                      <TableHead className="text-center font-black text-xs py-4 text-blue-900">{isRtl ? 'الكمية المرجعة' : 'Returned Qty'}</TableHead>
                      <TableHead className="text-center font-black text-xs py-4 text-blue-900">{isRtl ? 'الوحدة' : 'Unit'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voucher.returnedItems.map((item: any, i: number) => (
                      <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                        <TableCell className="font-bold text-sm py-4 text-slate-800">{item.nameAr}</TableCell>
                        <TableCell className="text-center font-black text-sm text-blue-700 tabular-nums">
                          {(item.qty || 0).toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-4">{item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : voucher.type === 'wage_payment' ? (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 uppercase">
              {isRtl ? 'تفاصيل السندات المشمولة في الصرف' : 'DETAILS OF PAID VOUCHERS'}
            </h4>
            <Table className="text-right border-2 border-emerald-900/10">
              <TableHeader className="bg-emerald-900/5">
                <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                  <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{isRtl ? 'رقم سند الاستلام' : 'Receipt #'}</TableHead>
                  <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{isRtl ? 'المنتج / البيان' : 'Product'}</TableHead>
                  <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'الكمية' : 'Qty'}</TableHead>
                  <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'المبلغ المستحق' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voucher.linkedReceipts?.map((receiptId: string, i: number) => {
                  const receipt = allReceipts?.find(r => r.id === receiptId);
                  const orderOfReceipt = allOrders?.find(o => o.id === receipt?.orderId);
                  const product = products?.find(p => p.id === orderOfReceipt?.productId);
                  return (
                    <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                      <TableCell className="font-bold text-sm tabular-nums">{receipt?.voucherNumber || '---'}</TableCell>
                      <TableCell className="font-bold text-sm text-slate-700">{product?.nameAr || (isRtl ? 'مستحق إنتاج' : 'Production Due')}</TableCell>
                      <TableCell className="text-center font-black text-sm tabular-nums">{(receipt?.qtyAccepted || 0).toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-center font-black text-sm tabular-nums text-emerald-700">{(receipt?.wageAmount || 0).toLocaleString('en-US')}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-emerald-900 text-white">
                  <TableCell colSpan={3} className="text-left font-black text-sm px-6 py-4 uppercase tracking-widest">
                    {isRtl ? 'إجمالي المبلغ المصروف نقداً' : 'TOTAL DISBURSED AMOUNT'}
                  </TableCell>
                  <TableCell className="text-center font-black text-2xl tabular-nums">
                    {(voucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-xs opacity-70">{voucher.currency}</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : voucher.type === 'overhead_cost' ? (
          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 uppercase">
              {isRtl ? 'تفاصيل المصروفات التشغيلية' : 'OPERATIONAL EXPENDITURE DETAILS'}
            </h4>
            <Table className="text-right border-2 border-emerald-900/10">
              <TableHeader className="bg-emerald-900/5">
                <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                  <TableHead className="text-right font-black text-xs py-4 text-emerald-900 uppercase">{isRtl ? 'البيان / الوصف' : 'Description'}</TableHead>
                  <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">{isRtl ? 'القيمة' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-white/40 border-b border-slate-100">
                  <TableCell className="py-6 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-base text-slate-900">{voucher.description}</span>
                      {voucher.notes && <span className="text-[10px] font-bold text-slate-400 uppercase">{voucher.notes}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-xl text-emerald-700 tabular-nums">
                    {(voucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-xs opacity-60">{voucher.currency}</span>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-emerald-900 text-white">
                  <TableCell className="px-6 py-4 font-black text-sm uppercase tracking-widest">{isRtl ? 'إجمالي السند المعتمد' : 'TOTAL AUTHORIZED AMOUNT'}</TableCell>
                  <TableCell className="text-center font-black text-2xl tabular-nums">{(voucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-xs opacity-70">{voucher.currency}</span></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 uppercase">
              {voucher.type === 'material_return' ? (isRtl ? 'تفاصيل المواد المرتجعة للمخزن' : 'RETURNED MATERIALS DETAILS') : (isRtl ? 'تفاصيل السند' : 'VOUCHER DETAILS')}
            </h4>
            <Table className="text-right border-2 border-emerald-900/10">
              <TableHeader className="bg-emerald-900/5">
                <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                  <TableHead className="text-right font-black text-xs py-4 text-emerald-900 uppercase">
                    {voucher.type === 'material_return' ? (isRtl ? 'اسم المادة المرتجعة' : 'Returned Item') : (isRtl ? 'البيان / المادة' : 'Description / Item')}
                  </TableHead>
                  <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">{isRtl ? 'الكمية' : 'Quantity'}</TableHead>
                  <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">{isRtl ? 'الوحدة' : 'Unit'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(voucher.items || voucher.returnedItems || []).map((item: any, i: number) => (
                  <TableRow key={i} className="border-b border-slate-100 bg-white/40">
                    <TableCell className="font-bold text-sm py-4 text-slate-800">{item.nameAr || item.nameEn}</TableCell>
                    <TableCell className="text-center font-black text-sm tabular-nums py-4 text-emerald-700">{item.qty}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-4">{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* PHOTO ATTACHMENT SECTION (For Costs) */}
      {voucher.type === 'overhead_cost' && voucher.invoicePhotoUrl && (
        <div className="mb-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative z-10 text-center">
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">{isRtl ? 'المرفقات / صورة الفاتورة' : 'ATTACHMENTS / INVOICE'}</h4>
          <img src={voucher.invoicePhotoUrl} className="max-h-96 mx-auto rounded-xl shadow-lg border-4 border-white" alt="invoice" />
        </div>
      )}

      {/* SIGNATURES SECTION */}
      <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
        <div className="space-y-12">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'أمين الصندوق' : 'Cashier'}</p>
          <div className="h-px bg-slate-300 w-3/4 mx-auto" />
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
        </div>
        <div className="space-y-12">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'المستفيد / المستلم' : 'Recipient'}</p>
          <div className="h-px bg-slate-300 w-3/4 mx-auto" />
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Full Name & Sign</p>
        </div>
        <div className="space-y-12">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'اعتماد الإدارة' : 'Manager Approval'}</p>
          <div className="h-px bg-slate-300 w-3/4 mx-auto" />
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized Signature</p>
        </div>
      </div>

      {/* PRINT FOOTER */}
      <div className="mt-14 pt-4 text-center border-t border-slate-50 relative z-10 flex items-center justify-center gap-4">
        <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Generated by TIA Production System</span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
        <span className="text-[8px] font-black text-slate-300 tabular-nums uppercase tracking-widest">{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}