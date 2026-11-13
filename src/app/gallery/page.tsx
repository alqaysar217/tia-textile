'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

/**
 * صفحة معرض الصور - تم إزالتها بناءً على طلب المدير.
 * تقوم الصفحة الآن بإعادة التوجيه تلقائياً للرئيسية.
 */
export default function GalleryPage() {
  useEffect(() => {
    redirect('/');
  }, []);

  return null;
}
