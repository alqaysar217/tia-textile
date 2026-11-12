'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Globe, AlertCircle, LogIn, ShieldCheck, Timer, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { lang, setLang, t, dir } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Lockout States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load failed attempts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prod_login_attempts');
    if (saved) {
      try {
        const { count, until } = JSON.parse(saved);
        setFailedAttempts(count);
        if (until && until > Date.now()) {
          setLockoutUntil(until);
        }
      } catch (e) {
        console.error("Failed to parse login attempts", e);
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    // Check if currently locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // CRITICAL FIX: Trim email and password to avoid invisible character errors (auth/invalid-credential)
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      
      // SUCCESS: Clear attempts
      setFailedAttempts(0);
      setLockoutUntil(null);
      localStorage.removeItem('prod_login_attempts');
      
      router.push('/production');
    } catch (err: any) {
      console.error("Login Error:", err.code);
      
      // FAILURE: Increment attempts
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);
      
      let newUntil = null;
      if (newCount >= 5) {
        const minutes = newCount - 4;
        newUntil = Date.now() + (minutes * 60 * 1000);
        setLockoutUntil(newUntil);
      }

      localStorage.setItem('prod_login_attempts', JSON.stringify({
        count: newCount,
        until: newUntil
      }));

      // Specific Error Messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(lang === 'ar' ? 'خطأ في البريد الإلكتروني أو كلمة المرور. تأكد من عدم وجود مسافات زائدة.' : 'Invalid email or password. Please ensure there are no extra spaces.');
      } else if (err.code === 'auth/user-disabled') {
        setError(lang === 'ar' ? 'تم تعطيل هذا الحساب من قبل الإدارة' : 'This account has been disabled by management');
      } else if (err.code === 'auth/too-many-requests') {
        setError(lang === 'ar' ? 'تم حظر المحاولات مؤقتاً بسبب كثرة الأخطاء' : 'Temporary block due to too many failed attempts');
      } else {
        setError(lang === 'ar' ? 'حدث خطأ في نظام الدخول، يرجى المحاولة لاحقاً' : 'An error occurred in the authentication system');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={dir}>
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 bg-[#F8F9FB]" />
      
      {/* Technical Grid Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#065F34 1px, transparent 1px), linear-gradient(90deg, #065F34 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Heritage-Tech Pattern Blobs */}
      <div className="fixed -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-1000 relative z-10">
        {/* Main Login Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[#0a7a44] to-secondary" />
          
          <div className="p-8 md:p-12 relative z-10">
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

              {timeLeft > 0 && (
                <Alert className="rounded-xl border-amber-200 bg-amber-50 animate-pulse">
                  <Timer className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-xs font-black text-amber-800">
                    {lang === 'ar' ? 'تم الحظر مؤقتاً' : 'Temporarily Blocked'}
                  </AlertTitle>
                  <AlertDescription className="text-[11px] font-bold text-amber-700">
                    {lang === 'ar' 
                      ? `يرجى المحاولة مرة أخرى بعد ${formatTime(timeLeft)} دقيقة` 
                      : `Please try again in ${formatTime(timeLeft)} minutes`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ps-1">
                  <Mail className="w-3.5 h-3.5 text-primary/60" />
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Staff Email'}
                </Label>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@association.com" 
                  required
                  disabled={timeLeft > 0 || loading}
                  className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all text-sm font-bold placeholder:text-gray-300 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary/60" />
                    {lang === 'ar' ? 'كلمة المرور' : 'Secure Password'}
                  </Label>
                </div>
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  disabled={timeLeft > 0 || loading}
                  className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all text-sm font-bold placeholder:text-gray-300 disabled:opacity-50"
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || timeLeft > 0}
                  className="w-full h-14 rounded-xl text-sm font-black shadow-xl shadow-primary/10 gap-3 bg-gradient-to-br from-primary via-[#0a7a44] to-[#054d2a] hover:opacity-95 border-none transition-all active:scale-[0.98] disabled:from-gray-400 disabled:to-gray-500"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
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

            <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                {lang === 'ar' ? 'اتصال محمي ومشفر' : 'Secure Encrypted Session'}
              </span>
            </div>
          </div>
        </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
