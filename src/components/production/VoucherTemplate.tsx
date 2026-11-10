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
  lang: string;
}

export function VoucherTemplate({ 
  voucher, 
  order, 
  worker, 
  supervisor, 
  departments, 
  products, 
  lang 
}: VoucherTemplateProps) {
  if (!voucher) return null;

  const isRtl = lang === 'ar';

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
             (isRtl ? 'سند رسمي' : 'Official Voucher')}
          </h3>
        </div>
      </div>

      {/* DATA GRID - 3 COLUMNS */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'اسم المستلم' : 'Recipient'}</span>
            <span className="text-sm font-black text-slate-900">{worker?.fullName || voucher.recipient || '---'}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'القسم / المسار' : 'Department'}</span>
            <span className="text-sm font-black text-slate-700">
               {departments?.find(d => d.id === voucher.currentStageId || d.id === worker?.departmentId)?.nameAr || '---'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'رقم السند' : 'Voucher No.'}</span>
            <span className="text-sm font-black text-emerald-900 tabular-nums tracking-wider">{voucher.voucherNumber}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'الدفعة' : 'Batch Name'}</span>
            <span className="text-sm font-black text-slate-700 truncate max-w-[150px]">{order?.title || '---'}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'تاريخ السند' : 'Date'}</span>
            <span className="text-sm font-black text-slate-700 tabular-nums">{voucher.date}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isRtl ? 'المشرف المسؤول' : 'Supervisor'}</span>
            <span className="text-sm font-black text-slate-700">{supervisor?.fullName || '---'}</span>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-12 relative z-10">
        <Table className="text-right border-2 border-emerald-900/10">
          <TableHeader className="bg-emerald-900/5">
            <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
              <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{isRtl ? 'البيان / المادة' : 'Description / Item'}</TableHead>
              <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'الكمية' : 'Quantity'}</TableHead>
              <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{isRtl ? 'الوحدة' : 'Unit'}</TableHead>
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
            {voucher.type === 'production_receipt' && (
              <TableRow className="bg-white/40">
                <TableCell className="font-bold text-sm py-5">
                  {products?.find(p => p.id === order?.productId)?.nameAr || '---'}
                </TableCell>
                <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">
                  {(voucher.qtyAccepted || 0).toLocaleString('en-US')} {isRtl ? 'قطعة' : 'Pcs'}
                </TableCell>
                <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-5">Pcs</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* SIGNATURES SECTION */}
      <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
        <div className="space-y-12">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'توقيع المستلم' : 'Recipient'}</p>
          <div className="h-px bg-slate-300 w-3/4 mx-auto" />
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
        </div>
        <div className="space-y-12">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{isRtl ? 'المحاسبة / المخازن' : 'Accounting/Store'}</p>
          <div className="h-px bg-slate-300 w-3/4 mx-auto" />
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
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