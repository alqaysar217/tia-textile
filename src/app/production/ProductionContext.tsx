'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * @fileOverview ProductionContext - المركز العصبي لصلاحيات النظام
 * تم تحسين الأنواع لضمان استقرار التقارير والعمليات المحاسبية.
 */

interface Permission {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  active: boolean;
  photoUrl?: string;
  permissions: Record<string, Permission>;
}

interface ProductionContextType {
  userProfile: UserProfile | null;
  permissions: Record<string, Permission>;
  isAdmin: boolean;
  isDeveloper: boolean;
  loading: boolean;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

// البريد الإلكتروني للمطور (صلاحيات مطلقة لأغراض الصيانة)
const DEV_EMAIL = 'alqaysarpc219@gmail.com';

export function ProductionProvider({ 
  children, 
  userProfile, 
  loading 
}: { 
  children: ReactNode; 
  userProfile: any; 
  loading: boolean;
}) {
  // المطور دائماً له صلاحيات كاملة، والأدمن المسجل كذلك
  const isDeveloper = userProfile?.email === DEV_EMAIL;
  const isAdmin = userProfile?.role === 'admin' || isDeveloper;
  
  // جلب الصلاحيات مع حماية ضد القيم الفارغة
  const rawPermissions = userProfile?.permissions || {};

  const value = {
    userProfile,
    permissions: rawPermissions,
    isAdmin,
    isDeveloper,
    loading
  };

  return (
    <ProductionContext.Provider value={value}>
      {children}
    </ProductionContext.Provider>
  );
}

/**
 * هوك مخصص لاستخدام بيانات الصلاحيات في أي واجهة
 */
export function useProduction() {
  const context = useContext(ProductionContext);
  if (context === undefined) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
}
