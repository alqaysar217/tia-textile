
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Factory, Lock, Mail, Globe, AlertCircle, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { lang, setLang, t, dir } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/production');
    } catch (err: any) {
      setError(lang === 'ar' ? 'خطأ في البريد الإلكتروني أو كلمة المرور' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/production');
    } catch (err: any) {
      setError(lang === 'ar' ? 'فشل تسجيل الدخول عبر جوجل' : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4" dir={dir}>
      {/* Background decoration */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      
      <div className="w-full max-w-[450px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 p-2 overflow-hidden border border-white/10">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900">{lang === 'ar' ? 'تسجيل دخول النظام' : 'System Login'}</h1>
            <p className="text-sm text-gray-500 font-medium">
              {lang === 'ar' ? 'نظام إدارة الإنتاج - جمعية الروضة' : 'Production Management System'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <form onSubmit={handleEmailLogin} className="space-y-5 relative z-10">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{lang === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ms-1">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors rtl:left-4 rtl:right-auto" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@association.com" 
                  required
                  className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-primary/5 transition-all rtl:pr-12 ltr:pl-12 text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ms-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors rtl:left-4 rtl:right-auto" />
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-primary/5 transition-all rtl:pr-12 ltr:pl-12 text-sm font-bold"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-primary/20 gap-3"
            >
              {loading ? (
                <span className="animate-pulse">{lang === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {lang === 'ar' ? 'دخول النظام' : 'Sign In'}
                </>
              )}
            </Button>
          </form>

          <div className="relative py-2 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{lang === 'ar' ? 'أو' : 'OR'}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-sm font-bold border-gray-100 hover:bg-gray-50 gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            {lang === 'ar' ? 'الدخول عبر جوجل' : 'Sign in with Google'}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-gray-400 hover:text-primary rounded-xl font-black text-[10px] gap-2"
          >
            <Globe className="w-4 h-4" />
            {lang === 'ar' ? 'English Version' : 'النسخة العربية'}
          </Button>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
            © 2027 PRODUCTION MANAGEMENT
          </p>
        </div>
      </div>
    </div>
  );
}
