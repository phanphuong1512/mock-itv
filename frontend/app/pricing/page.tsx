'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Check, 
  X, 
  Rocket, 
  Zap, 
  UserCircle2, 
  ShieldCheck, 
  CreditCard, 
  QrCode,
  ChevronDown,
  Lock,
  MessageCircle,
  FileText,
  Repeat,
  GitCommit,
  Code2,
  Mic,
  Users,
  FastForward,
  Banknote
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';

export default function PricingPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-foreground font-sans selection:bg-blue-500/30">
      <Navbar />
      
      {/* ===== HERO SECTION ===== */}
      <section className="pt-28 pb-8 px-6 lg:px-12 text-center max-w-4xl mx-auto">

        <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
          {t('pricing.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </section>

      {/* ===== PRICING CARDS ===== */}
      <section className="px-6 lg:px-12 max-w-5xl mx-auto mb-16">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Card 1 - Miễn phí */}
          <div className="bg-white dark:bg-[#151E32] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col h-full relative group">
            <div className="absolute top-6 right-6">
              <Check className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{t('pricing.free')}</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-extrabold">0đ</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 pb-6 border-b border-slate-200 dark:border-white/5">4 lượt luyện tập / tháng</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="2 Phỏng vấn AI" included={true} />
              <FeatureItem text="2 Sàng lọc CV" included={true} />
              <FeatureItem text="4 Lượt luyện tập" included={true} />
              <FeatureItem text="Pipeline đa vòng" included={true} />
              <FeatureItem text="Phỏng vấn Coding" included={false} />
              <FeatureItem text="AI giọng nói" included={false} />
              <FeatureItem text="Phỏng vấn với người thật" included={false} />
              <FeatureItem text="Ưu tiên hàng đợi" included={false} />
            </ul>
            
            <button className="w-full py-3.5 bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-bold rounded-full cursor-not-allowed">
              {t('pricing.current')}
            </button>
          </div>

          {/* Card 2 - Pro (Highlighted) */}
          <div className="bg-white dark:bg-[#050A15] rounded-[2rem] p-6 border-2 border-blue-500 relative flex flex-col h-full shadow-[0_0_40px_rgba(37,99,235,0.2)] transform lg:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full tracking-widest uppercase">
              {t('pricing.popular')}
            </div>
            
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Pro</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-extrabold">99k</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 mb-1">/tháng</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 pb-6 border-b border-slate-200 dark:border-white/5">15 lượt luyện tập / tháng</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="25 Phỏng vấn AI" included={true} blueIcon={true} />
              <FeatureItem text="15 Sàng lọc CV" included={true} blueIcon={true} />
              <FeatureItem text="15 Lượt luyện tập" included={true} blueIcon={true} />
              <FeatureItem text="Pipeline đa vòng" included={true} blueIcon={true} />
              <FeatureItem text="Phỏng vấn Coding" included={true} blueIcon={true} />
              <FeatureItem text="AI giọng nói" included={true} blueIcon={true} />
              <FeatureItem text="Phỏng vấn với người thật" included={false} />
              <FeatureItem text="Ưu tiên hàng đợi" included={true} blueIcon={true} />
            </ul>
            
            <button className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-blue-500/20">
              {t('pricing.start')}
            </button>
          </div>

          {/* Card 3 - 1-1 Mock */}
          <div className="bg-white dark:bg-[#151E32] rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col h-full">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mb-6">
              <UserCircle2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{t('pricing.mock11')}</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-extrabold">{t('pricing.contact')}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 pb-6 border-b border-slate-200 dark:border-white/5">20 lượt luyện tập / tháng</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="25 Phỏng vấn AI" included={true} blueIcon={true} />
              <FeatureItem text="15 Sàng lọc CV" included={true} blueIcon={true} />
              <FeatureItem text="20 Lượt luyện tập" included={true} blueIcon={true} />
              <FeatureItem text="Pipeline đa vòng" included={true} blueIcon={true} />
              <FeatureItem text="Phỏng vấn Coding" included={true} blueIcon={true} />
              <FeatureItem text="AI giọng nói" included={true} blueIcon={true} />
              <FeatureItem text="Phỏng vấn với người thật" included={true} blueIcon={true} />
              <FeatureItem text="Ưu tiên hàng đợi" included={true} blueIcon={true} />
            </ul>
            
            <button className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full transition-colors">
              {t('pricing.contact')}
            </button>
          </div>

        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="px-6 lg:px-12 max-w-5xl mx-auto mb-16">
        <div className="bg-white dark:bg-[#0A0F1C] rounded-[2rem] p-6 lg:p-8 border border-slate-200 dark:border-white/5 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-center">{t('pricing.compare')}</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5">
                  <th className="py-4 font-semibold text-slate-600 dark:text-slate-400 w-[40%]">Tính năng</th>
                  <th className="py-4 font-bold text-center w-[20%]">
                    <div className="text-blue-400">Miễn phí</div>
                    <div className="text-[9px] uppercase tracking-wider bg-blue-900/40 text-blue-300 inline-block px-2 py-0.5 rounded mt-1">Đang dùng</div>
                  </th>
                  <th className="py-4 font-bold text-center w-[20%]">Pro</th>
                  <th className="py-4 font-bold text-center w-[20%]">1-1 Mock</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <TableRow icon={<MessageCircle className="w-4 h-4" />} title="Phỏng vấn AI" free="2" pro="25" mock="25" />
                <TableRow icon={<FileText className="w-4 h-4" />} title="Sàng lọc CV" free="2" pro="15" mock="15" />
                <TableRow icon={<Repeat className="w-4 h-4" />} title="Lượt luyện tập" free="4" pro="15" mock="20" />
                <TableRow icon={<GitCommit className="w-4 h-4" />} title="Pipeline đa vòng" free={true} pro={true} mock={true} />
                <TableRow icon={<Code2 className="w-4 h-4" />} title="Phỏng vấn Coding" free={false} pro={true} mock={true} />
                <TableRow icon={<Mic className="w-4 h-4" />} title="AI giọng nói" free={false} pro={true} mock={true} />
                <TableRow icon={<Users className="w-4 h-4" />} title="Phỏng vấn với người thật" free={false} pro={false} mock={true} />
                <TableRow icon={<FastForward className="w-4 h-4" />} title="Ưu tiên hàng đợi" free={false} pro={true} mock={true} />
                <tr className="border-t border-slate-200 dark:border-white/5">
                  <td className="py-6 font-bold flex items-center gap-3">
                    <Banknote className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Giá
                  </td>
                  <td className="py-6 font-bold text-center text-lg">0đ</td>
                  <td className="py-6 font-bold text-center text-lg">99k<span className="text-xs text-slate-600 dark:text-slate-400 font-normal">/tháng</span></td>
                  <td className="py-6 font-bold text-center text-lg">Liên hệ</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 mt-8 pt-6 border-t border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2"><QrCode className="w-4 h-4" /> QR chuyển khoản ngân hàng</div>
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Thẻ Visa/Mastercard/JCB</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Bảo mật bởi SePay</div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="px-6 lg:px-12 max-w-3xl mx-auto mb-24">
        <h2 className="text-2xl font-bold mb-10 text-center">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          <FaqItem question="Tôi có thể hủy gói Pro bất cứ lúc nào không?" answer="Có, bạn có thể hủy gia hạn gói Pro bất cứ lúc nào trong phần cài đặt tài khoản. Bạn vẫn có thể sử dụng các tính năng của gói Pro cho đến hết chu kỳ thanh toán hiện tại." />
          <FaqItem question="Hết lượt phỏng vấn thì sao?" answer="Nếu bạn dùng hết số lượt phỏng vấn hoặc lượt luyện tập trong tháng, bạn có thể mua thêm các gói bổ sung lượt lẻ hoặc nâng cấp gói để tiếp tục sử dụng mà không bị gián đoạn." />
          <FaqItem question="1-1 Mock khác gì Pro?" answer="Gói 1-1 Mock bao gồm tất cả tính năng của gói Pro, kèm theo các buổi phỏng vấn trực tiếp với Mentor (người thật) là các chuyên gia/Senior đang làm việc tại các công ty công nghệ lớn." />
          <FaqItem question="Thanh toán bằng cách nào?" answer="Chúng tôi hỗ trợ thanh toán qua chuyển khoản ngân hàng (quét mã QR) và thanh toán qua thẻ quốc tế Visa/Mastercard/JCB." />
          <FaqItem question="Thanh toán có an toàn không?" answer="Hoàn toàn an toàn. Hệ thống thanh toán của chúng tôi được xử lý và bảo mật bởi SePay, tuân thủ các tiêu chuẩn bảo mật quốc tế." />
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Subcomponents

function FeatureItem({ text, included, blueIcon = false }: { text: string, included: boolean, blueIcon?: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm font-medium ${included ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        included 
          ? blueIcon ? 'text-blue-500' : 'border border-blue-500 text-blue-500' 
          : 'border border-slate-700 text-slate-700'
      }`}>
        {included ? (
           blueIcon ? <Check className="w-4 h-4 stroke-[3]" /> : <Check className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </div>
      {text}
    </li>
  );
}

function TableRow({ icon, title, free, pro, mock }: { icon: React.ReactNode, title: string, free: string | boolean, pro: string | boolean, mock: string | boolean }) {
  
  const renderValue = (val: string | boolean) => {
    if (typeof val === 'string') return <span className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-300">{val}</span>;
    if (val === true) return <Check className="w-5 h-5 text-blue-500 mx-auto" />;
    return <X className="w-5 h-5 text-slate-700 mx-auto" />;
  };

  return (
    <tr className="border-b border-slate-200 dark:border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
        {icon} {title}
      </td>
      <td className="py-3 text-center">{renderValue(free)}</td>
      <td className="py-3 text-center">{renderValue(pro)}</td>
      <td className="py-3 text-center">{renderValue(mock)}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white dark:bg-[#151E32] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-slate-800 dark:text-slate-200 hover:bg-white/[0.02] transition-colors"
      >
        {question}
        <ChevronDown className={`w-4 h-4 text-foreground0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-10 py-6 text-center text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-background/30"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}
