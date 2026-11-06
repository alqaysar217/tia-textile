
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Globe, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4" dir={dir}>
      {/* Background decoration */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 p-2 overflow-hidden">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'ar' ? 'نظام إدارة الإنتاج' : 'Production Management System'}
            </h1>
            <p className="text-xs text-primary font-bold uppercase tracking-widest opacity-70">
              {lang === 'ar' ? 'جمعية الصناعات النسيجية - الروضة' : 'Textile Industries Association'}
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <form onSubmit={handleEmailLogin} className="space-y-6 relative z-10">
            {error && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-black">{lang === 'ar' ? 'فشل الدخول' : 'Access Denied'}</AlertTitle>
                <AlertDescription className="text-[11px] font-bold">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ms-1 flex items-center gap-2">
                <Mail className="w-3 h-3 text-primary/50" />
                {lang === 'ar' ? 'البريد الإلكتروني للموظف' : 'Staff Email Address'}
              </Label>
              <div className="relative group">
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@association.com" 
                  required
                  className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 transition-all text-sm font-bold placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-primary/50" />
                  {lang === 'ar' ? 'كلمة المرور' : 'Secure Password'}
                </Label>
                <button type="button" className="text-[9px] font-black text-primary/40 hover:text-primary transition-colors uppercase tracking-tighter">
                  {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot?'}
                </button>
              </div>
              <div className="relative group">
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 transition-all text-sm font-bold placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-black shadow-lg shadow-primary/10 gap-3 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {lang === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {lang === 'ar' ? 'تسجيل الدخول للنظام' : 'Access Dashboard'}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              {lang === 'ar' ? 'نظام محمي ومشفر' : 'Encrypted & Secure Session'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-gray-400 hover:text-primary rounded-xl font-black text-[10px] gap-2 hover:bg-white border border-transparent hover:border-gray-100 px-4"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'English Version' : 'النسخة العربية'}
          </Button>
          
          <div className="text-center space-y-1">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">
              © 2027 PRODUCTION MANAGEMENT SYSTEM
            </p>
            <p className="text-[8px] font-bold text-primary/30 uppercase tracking-[0.2em]">
              {lang === 'ar' ? 'وحدة تقنية المعلومات - جمعية الروضة' : 'IT Department - Al-Rawdah Association'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
