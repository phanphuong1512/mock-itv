'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage();
  const { loginWithGoogle, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push('/mocks');
    }
  }, [user, router]);


  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError(null);
      if (!credentialResponse.credential) {
        throw new Error('Không nhận được credential từ Google');
      }
      await loginWithGoogle(credentialResponse.credential);
      router.push('/mocks');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Đăng nhập với Google thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex flex-col relative selection:bg-blue-500/30">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top right language toggle */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-12 z-10">
        <div className="flex items-center bg-foreground/10 rounded-full p-1 text-xs font-semibold">
          <button 
            onClick={() => setLang('EN')}
            className={`px-3 py-1 rounded-full transition-all ${lang === 'EN' ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-foreground/5'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('VI')}
            className={`px-3 py-1 rounded-full transition-all ${lang === 'VI' ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-foreground/5'}`}
          >
            VI
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-4xl font-bold tracking-tight mb-3">
            <span className="text-blue-500">Mock</span>
            <span className="text-emerald-500 relative">
              ITV
              <Sparkles className="absolute -top-3 -right-4 w-5 h-5 text-emerald-400" />
            </span>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-card-bg rounded-[2rem] p-8 sm:p-10 border border-foreground/5 shadow-2xl shadow-blue-500/10 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">{t('login.welcome')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('login.prompt')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button Container */}
          <div className="flex flex-col items-center justify-center mb-8">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-3 px-6 bg-foreground/5 rounded-full text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Đang xác thực tài khoản Google...</span>
              </div>
            ) : (
              <div className="w-full flex justify-center scale-105">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In gặp lỗi kết nối')}
                  useOneTap={false}
                  theme="filled_blue"
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}
          </div>

          <p className="text-center text-xs text-foreground/50 leading-relaxed">
            {t('login.terms')}{' '}
            <Link href="#" className="text-blue-500 hover:underline">{t('login.term1')}</Link>{' '}
            {t('login.and')}{' '}
            <Link href="#" className="text-blue-500 hover:underline">{t('login.term2')}</Link>
          </p>
        </div>


        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-500 mb-1">2K+</h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Kỹ sư</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-500 mb-1">89%</h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Tỷ lệ đậu</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-500 mb-1">50+</h3>
            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Công ty</p>
          </div>
        </div>
      </div>
    </main>
  );
}
