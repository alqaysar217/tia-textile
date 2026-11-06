
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
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-4 relative" dir={dir}>
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none textile-pattern" />
      
      <div className="w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-700">
        {/* Main Login Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[#0a7a44] to-secondary" />
          
          <div className="p-8 md:p-12 relative z-10">
            {/* Branding Section - Now Inside the Card */}
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-50 p-2 group hover:scale-105 transition-transform duration-500">
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                  {lang === 'ar' ? 'نظام إدارة الإنتاج' : 'Production Management'}
                </h1>
                <p className="text-[10px] text-primary/70 font-black uppercase tracking-[0.2em]">
                  {lang === 'ar' ? 'جمعية الصناعات النسيجية - الروضة' : 'Textile Industries Association'}
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="rounded-xl border-destructive/10 bg-destructive/5 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-black">{lang === 'ar' ? 'خطأ في الدخول' : 'Access Error'}</AlertTitle>
                  <AlertDescription className="text-[11px] font-bold">{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ps-1">
                  <Mail className="w-3.5 h-3.5 text-primary/60" />
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Staff Email'}
                </Label>
                <div className="relative">
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@association.com" 
                    required
                    className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all text-sm font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary/60" />
                    {lang === 'ar' ? 'كلمة المرور' : 'Secure Password'}
                  </Label>
                  <button type="button" className="text-[9px] font-black text-primary/40 hover:text-primary transition-colors uppercase">
                    {lang === 'ar' ? 'نسيت؟' : 'Forgot?'}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                    className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all text-sm font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Submit Button with Gradient */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 rounded-xl text-sm font-black shadow-xl shadow-primary/10 gap-3 bg-gradient-to-br from-primary via-[#0a7a44] to-[#054d2a] hover:opacity-95 border-none transition-all active:scale-[0.98]"
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

            {/* Security Indicator */}
            <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                {lang === 'ar' ? 'اتصال محمي ومشفر' : 'Secure Encrypted Session'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions Outside Card */}
        <div className="flex flex-col items-center gap-6 mt-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-gray-400 hover:text-primary rounded-xl font-black text-[10px] gap-2 hover:bg-white border border-transparent hover:border-gray-200/50 px-5 h-10 transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'English Version' : 'النسخة العربية'}
          </Button>
          
          <div className="text-center space-y-1.5 opacity-40">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">
              © 2027 PRODUCTION MANAGEMENT SYSTEM
            </p>
            <p className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">
              {lang === 'ar' ? 'وحدة تكنولوجيا المعلومات' : 'IT Department - Al-Rawdah'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
