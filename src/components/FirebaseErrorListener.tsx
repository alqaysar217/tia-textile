'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/LanguageProvider';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const { lang } = useTranslation();

  useEffect(() => {
    const handleError = (error: any) => {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'خطأ في الصلاحيات' : 'Permission Error',
        description: lang === 'ar' 
          ? 'ليس لديك الإذن الكافي للقيام بهذه العملية.' 
          : 'You do not have sufficient permissions for this operation.',
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, lang]);

  return null;
}
