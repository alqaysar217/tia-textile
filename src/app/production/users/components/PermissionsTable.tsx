'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { SYSTEM_MODULES } from '../constants';
import { cn } from '@/lib/utils';

interface PermissionsTableProps {
  lang: string;
  permissions: Record<string, { read: boolean; create: boolean; edit: boolean; delete: boolean }>;
  onTogglePermission: (moduleId: string, type: 'read' | 'create' | 'edit' | 'delete') => void;
  onToggleRow: (moduleId: string, checked: boolean) => void;
  onToggleColumn: (type: 'read' | 'create' | 'edit' | 'delete', checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

export function PermissionsTable({
  lang,
  permissions,
  onTogglePermission,
  onToggleRow,
  onToggleColumn,
  onToggleAll
}: PermissionsTableProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <Table className="text-right border-separate border-spacing-0">
        <TableHeader className="bg-slate-50 dark:bg-slate-800">
          <TableRow>
            <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>
               <div className="flex items-center gap-3">
                  <Checkbox 
                    onCheckedChange={(val) => onToggleAll(!!val)} 
                    className="data-[state=checked]:bg-slate-900" 
                  />
                  <span>{isRtl ? 'واجهة النظام' : 'INTERFACE / MODULE'}</span>
               </div>
            </TableHead>
            <TableHead className="w-24 text-center">
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Checkbox onCheckedChange={(val) => onToggleColumn('read', !!val)} className="data-[state=checked]:bg-blue-600" />
                <span className="text-[9px] font-black text-blue-600 uppercase">{isRtl ? 'دخول/رؤية' : 'READ'}</span>
              </div>
            </TableHead>
            <TableHead className="w-24 text-center">
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Checkbox onCheckedChange={(val) => onToggleColumn('create', !!val)} className="data-[state=checked]:bg-emerald-600" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">{isRtl ? 'إضافة' : 'CREATE'}</span>
              </div>
            </TableHead>
            <TableHead className="w-24 text-center">
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Checkbox onCheckedChange={(val) => onToggleColumn('edit', !!val)} className="data-[state=checked]:bg-amber-600" />
                <span className="text-[9px] font-black text-amber-600 uppercase">{isRtl ? 'تعديل' : 'EDIT'}</span>
              </div>
            </TableHead>
            <TableHead className="w-24 text-center">
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Checkbox onCheckedChange={(val) => onToggleColumn('delete', !!val)} className="data-[state=checked]:bg-rose-600" />
                <span className="text-[9px] font-black text-rose-600 uppercase">{isRtl ? 'حذف' : 'DELETE'}</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SYSTEM_MODULES.map(module => {
            const perms = permissions[module.id] || { read: false, create: false, edit: false, delete: false };
            const isRowPartial = perms.read || perms.create || perms.edit || perms.delete;
            const isRowFull = perms.read && perms.create && perms.edit && perms.delete;

            return (
              <TableRow key={module.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                <TableCell className={cn("px-6 py-3 font-bold text-xs dark:text-slate-200", isRtl ? "text-right" : "text-left")}>
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={isRowFull}
                      // Indeterminate logic: if any perm selected but not all, show as checked or partially
                      className={cn("data-[state=checked]:bg-slate-900", isRowPartial && !isRowFull && "opacity-50")}
                      onCheckedChange={(val) => onToggleRow(module.id, !!val)} 
                    />
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-600">
                        {module.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-slate-100">{isRtl ? module.labelAr : module.labelEn}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tabular-nums tracking-tighter">{module.id}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={perms.read} onCheckedChange={() => onTogglePermission(module.id, 'read')} className="data-[state=checked]:bg-blue-600" />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={perms.create} onCheckedChange={() => onTogglePermission(module.id, 'create')} className="data-[state=checked]:bg-emerald-600" />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={perms.edit} onCheckedChange={() => onTogglePermission(module.id, 'edit')} className="data-[state=checked]:bg-amber-600" />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={perms.delete} onCheckedChange={() => onTogglePermission(module.id, 'delete')} className="data-[state=checked]:bg-rose-600" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
