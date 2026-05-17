'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'VI' | 'EN';

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  VI: {
    'nav.mock': 'Mock tuyển dụng',
    'nav.pricing': 'Bảng giá',
    'nav.start': 'Bắt đầu ngay',
    'hero.title': 'Chinh phục\nDream Jobs với\nMockITV',
    'hero.subtitle': 'Mock phỏng vấn với AI - luyện đều từng vòng để nâng kỹ năng phỏng vấn mỗi tuần.',
    'hero.btn.start': 'Bắt đầu mock phỏng vấn',
    'hero.btn.plan': 'Xem kế hoạch luyện tập',
    'status.offer': 'Đã nhận Offer',
    'status.title': 'Trạng thái',
    'login.subtitle': 'Chinh phục phỏng vấn Dream Jobs',
    'login.welcome': 'Chào mừng trở lại',
    'login.prompt': 'Đăng nhập để tiếp tục hành trình phỏng vấn',
    'login.btn': 'Tiếp tục với Google',
    'login.terms': 'Bằng việc tiếp tục, bạn đồng ý với',
    'login.term1': 'Điều khoản dịch vụ',
    'login.term2': 'Chính sách bảo mật',
    'login.and': 'và',
    'pricing.title': 'Chọn gói phù hợp với bạn',
    'pricing.subtitle': 'Từ luyện tập miễn phí đến phỏng vấn 1-1 với chuyên gia - tất cả đều được hỗ trợ bởi AI.',
    'pricing.free': 'Miễn phí',
    'pricing.popular': 'Phổ biến nhất',
    'pricing.pro': 'Pro',
    'pricing.mock11': '1-1 Mock',
    'pricing.contact': 'Liên hệ',
    'pricing.current': 'Gói hiện tại',
    'pricing.start': 'Bắt đầu ngay',
    'pricing.compare': 'So sánh chi tiết'
  },
  EN: {
    'nav.mock': 'Mock Interviews',
    'nav.pricing': 'Pricing',
    'nav.start': 'Get Started',
    'hero.title': 'Conquer\nDream Jobs with\nMockITV',
    'hero.subtitle': 'Mock interviews with AI - practice every round to improve interview skills weekly.',
    'hero.btn.start': 'Start Mock Interview',
    'hero.btn.plan': 'View Study Plan',
    'status.offer': 'Offer Received',
    'status.title': 'Status',
    'login.subtitle': 'Conquer Dream Jobs Interviews',
    'login.welcome': 'Welcome back',
    'login.prompt': 'Log in to continue your interview journey',
    'login.btn': 'Continue with Google',
    'login.terms': 'By continuing, you agree to our',
    'login.term1': 'Terms of Service',
    'login.term2': 'Privacy Policy',
    'login.and': 'and',
    'pricing.title': 'Choose the right plan for you',
    'pricing.subtitle': 'From free practice to 1-1 expert interviews - all powered by AI.',
    'pricing.free': 'Free',
    'pricing.popular': 'Most Popular',
    'pricing.pro': 'Pro',
    'pricing.mock11': '1-1 Mock',
    'pricing.contact': 'Contact Us',
    'pricing.current': 'Current Plan',
    'pricing.start': 'Get Started',
    'pricing.compare': 'Detailed Comparison'
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('VI');

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['VI']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
