'use client';

import Link from 'next/link';
import { Sparkles, Sun, Moon, LogOut, User as UserIcon, ChevronDown, History, Zap } from 'lucide-react';

import { useLanguage } from './LanguageProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <Link href="/mocks" className="hover:text-blue-500 transition-colors">{t('nav.mock')}</Link>
          <Link href="/custom-mock" className="hover:text-blue-500 transition-colors flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Custom Mock
          </Link>
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
            title="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        
        {user ? (
          /* Logged In Profile Dropdown */
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all cursor-pointer"
            >
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-blue-500/40"
              />
              <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:inline">
                {user.name}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card-bg border border-foreground/10 rounded-2xl shadow-2xl p-2.5 z-50 text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-3 border-b border-foreground/10 mb-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      (user.plan || 'free') === 'premium'
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : (user.plan || 'free') === 'pro'
                        ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                        : 'bg-foreground/10 text-foreground/60'
                    }`}>
                      {user.plan === 'premium' ? 'Premium VIP' : user.plan === 'pro' ? 'Pro' : 'Miễn phí'}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 truncate">{user.email}</p>
                  <div className="mt-2 pt-2 border-t border-foreground/5 flex items-center justify-between text-xs">
                    <span className="text-foreground/60">Lượt mock còn lại:</span>
                    <span className="font-bold text-blue-500">{user.credits ?? 4} lượt</span>
                  </div>
                </div>

                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-foreground/5 transition-colors"
                >
                  <History className="w-4 h-4 text-blue-500" />
                  Lịch sử mock phỏng vấn
                </Link>

                <Link
                  href="/custom-mock"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-foreground/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Custom Mock cá nhân
                </Link>

                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-foreground/5 text-blue-500 font-semibold transition-colors"
                >
                  <Zap className="w-4 h-4 text-blue-500" />
                  Nâng cấp gói dịch vụ
                </Link>

                <div className="my-1 border-t border-foreground/10" />


                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Login Button */
          <Link href="/login" className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {t('nav.start')}
          </Link>
        )}
      </div>
    </nav>
  );
}
