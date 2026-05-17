'use client';

import Link from 'next/link';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 lg:px-32 xl:px-40 bg-background/80 backdrop-blur-md border-b border-foreground/5 text-foreground transition-colors">
      <div className="flex items-center gap-12">
        {/* Logo */}
        <Link href="/" className="flex items-center text-2xl font-bold tracking-tight">
          <span className="text-blue-500">Mock</span>
          <span className="text-emerald-500 relative">
            ITV
            <Sparkles className="absolute -top-3 -right-3 w-4 h-4 text-emerald-400" />
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-base font-bold opacity-80 hover:opacity-100 transition-opacity">
          <Link href="/jobs" className="hover:text-blue-500 transition-colors">{t('nav.mock')}</Link>
          <Link href="/history" className="hover:text-blue-500 transition-colors">Lịch sử mock</Link>
          <Link href="/pricing" className="hover:text-blue-500 transition-colors">{t('nav.pricing')}</Link>
        </div>
      </div>

      {/* Right Nav */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-foreground/10 rounded-full p-1 text-xs font-semibold">
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
        
        {mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        
        <Link href="/login" className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {t('nav.start')}
        </Link>
      </div>
    </nav>
  );
}
