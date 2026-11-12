'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * @fileOverview ProductionContext - محرك الصلاحيات المركزي
 * هذا الملف هو المسؤول عن توفير بيانات المستخدم وصلاحياته لكل أجزاء النظام.
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
  loading: boolean;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

export function ProductionProvider({ 
  children, 
  userProfile, 
  loading 
}: { 
  children: ReactNode; 
  userProfile: any; 
  loading: boolean;
}) {
  const isAdmin = userProfile?.role === 'admin';
  
  // دالة ذكية لفحص الصلاحية؛ إذا كان أدمن فله كل الصلاحيات دائماً
  const permissions = userProfile?.permissions || {};

  const value = {
    userProfile,
    permissions,
    isAdmin,
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
