'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage();

  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-foreground font-sans flex flex-col relative selection:bg-blue-500/30">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top right language toggle */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-12 z-10">
        <div className="flex items-center bg-slate-200 dark:bg-white/10 rounded-full p-1 text-xs font-semibold">
          <button 
            onClick={() => setLang('EN')}
            className={`px-3 py-1 rounded-full transition-all ${lang === 'EN' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-white'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('VI')}
            className={`px-3 py-1 rounded-full transition-all ${lang === 'VI' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-white'}`}
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
        <div className="w-full max-w-md bg-card-bg rounded-[2rem] p-8 sm:p-10 border border-foreground/5 shadow-2xl shadow-blue-500/10 mb-12">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">{t('login.welcome')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('login.prompt')}</p>
          </div>

          <button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-6 rounded-full transition-colors mb-10">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('login.btn')}
          </button>

          <p className="text-center text-xs text-foreground0 leading-relaxed">
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
