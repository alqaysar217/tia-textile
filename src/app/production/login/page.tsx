'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Globe, AlertCircle, LogIn, Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { lang, setLang, dir } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Security States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Handle Lockout Countdown
  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!auth) return;

    setLoading(true);
    setError('');
    
    try {
      if (!cleanEmail || !cleanPassword) {
        throw { code: 'auth/invalid-credential' };
      }

      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      setFailedAttempts(0);
      router.push('/production');
    } catch (err: any) {
      console.error("Login Error Details:", err.code);

      // Increment failed attempts
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      if (newCount >= 5) {
        const until = Date.now() + 5 * 60 * 1000; // 5 minutes
        setLockoutUntil(until);
        setError(lang === 'ar' ? 'تم الحظر مؤقتاً لتجاوز محاولات الدخول. يرجى المحاولة لاحقاً.' : 'Account temporarily locked due to many attempts.');
      } else {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError(lang === 'ar' ? `البريد الإلكتروني أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${5 - newCount}` : `Invalid credentials. Attempts left: ${5 - newCount}`);
        } else if (err.code === 'auth/network-request-failed') {
          setError(lang === 'ar' ? 'فشل الاتصال بالخادم. يرجى التحقق من جودة الإنترنت.' : 'Network connection failed. Check your internet.');
        } else {
          setError(lang === 'ar' ? 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.' : 'An unexpected error occurred. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={dir}>
      <div className="fixed inset-0 bg-[#F8F9FB]" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#065F34 1px, transparent 1px), linear-gradient(90deg, #065F34 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-1000 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[#0a7a44] to-secondary" />
          
          <div className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-50 p-2 group hover:scale-105 transition-transform duration-500">
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">{lang === 'ar' ? 'نظام إدارة الإنتاج' : 'Production Management'}</h1>
                <p className="text-[10px] text-primary/70 font-black uppercase tracking-[0.2em]">{lang === 'ar' ? 'جمعية الصناعات النسيجية - الروضة' : 'Textile Industries Association'}</p>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="rounded-xl border-destructive/10 bg-destructive/5 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-black">{lang === 'ar' ? 'تنبيه أمني' : 'Security Alert'}</AlertTitle>
                  <AlertDescription className="text-[11px] font-bold">{error}</AlertDescription>
                </Alert>
              )}

              {lockoutUntil && (
                <Alert className="rounded-xl border-amber-200 bg-amber-50 animate-pulse">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-xs font-black text-amber-900">{lang === 'ar' ? 'تم الحظر مؤقتاً' : 'Temporary Lockout'}</AlertTitle>
                  <AlertDescription className="text-[11px] font-bold text-amber-700">
                    {lang === 'ar' ? `يرجى المحاولة بعد ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} دقيقة` : `Please retry in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} min`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ps-1">
                  <Mail className="w-3.5 h-3.5 text-primary/60" /> {lang === 'ar' ? 'البريد الإلكتروني' : 'Staff Email'}
                </Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@association.com" required disabled={loading || timeLeft > 0} className="h-12 rounded-xl bg-gray-50/50 border-gray-100 font-bold text-sm" />
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ps-1">
                  <Lock className="w-3.5 h-3.5 text-primary/60" /> {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading || timeLeft > 0} className="h-12 rounded-xl bg-gray-50/50 border-gray-100 font-bold text-sm" />
              </div>

              <Button type="submit" disabled={loading || timeLeft > 0} className="w-full h-14 rounded-xl text-sm font-black shadow-xl shadow-primary/10 gap-3 bg-gradient-to-br from-primary via-[#0a7a44] to-[#054d2a] hover:opacity-95 border-none transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {lang === 'ar' ? 'تسجيل الدخول للنظام' : 'Access Dashboard'}
              </Button>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{lang === 'ar' ? 'اتصال محمي ومشفر' : 'Secure Encrypted Session'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-8">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="text-gray-400 hover:text-primary rounded-xl font-black text-[10px] gap-2 hover:bg-white border border-transparent hover:border-gray-200/50 px-5 h-10 transition-all shadow-sm">
            <Globe className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'English Version' : 'النسخة العربية'}
          </Button>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] opacity-40">© 2027 PRODUCTION MANAGEMENT SYSTEM</p>
        </div>
      </div>
    </div>
  );
}
