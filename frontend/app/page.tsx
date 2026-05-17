'use client';

import { 
  Sparkles, 
  Sun, 
  LineChart,
  Brain,
  Building2,
  TrendingUp,
  Network,
  Rocket,
  Check,
  Calendar,
  ArrowRight,
  ChevronRight,
  Terminal,
  Star,
  User,
  Globe,
  Users,
  Code2,
  ExternalLink,
  UserCircle2,
  BadgeCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30">
      
      <Navbar />
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 overflow-hidden max-w-7xl mx-auto">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left Content */}
          <div className="space-y-8 max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight whitespace-pre-line"
            >
              {t('hero.title')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-md"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 text-sm font-semibold rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {t('hero.btn.start')}
                <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {t('hero.btn.plan')}
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-4 pt-8"
            >
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-[#0B1120] flex items-center justify-center text-xs overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar"/></div>
                <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-[#0B1120] flex items-center justify-center text-xs overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="avatar"/></div>
                <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-[#0B1120] flex items-center justify-center text-xs overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="avatar"/></div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[280px] leading-relaxed">
                Kịch bản phỏng vấn được thiết kế bởi các kỹ sư từ các công ty IT top đầu Việt Nam dựa trên các vòng tuyển dụng thực tế
              </p>
            </motion.div>
          </div>

          {/* Right Content - 3D Illustration / Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[500px] w-full max-w-lg mx-auto rounded-[2.5rem] bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex items-center justify-center overflow-visible"
          >
            {/* The 3D character placeholder (we will use a nice generic gradient/shape or leave it empty for now, or just an icon since we can't easily fetch a 3D image) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#111827] via-[#1a253a] to-[#1e3a5f] rounded-[2.5rem] opacity-80" />
            
            {/* Floating UI Elements */}
            <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-slate-100 dark:bg-white/5 backdrop-blur-md rounded-xl border border-white/10 rotate-[-12deg]" />
            <div className="absolute top-1/3 right-1/4 w-40 h-24 bg-blue-500/10 backdrop-blur-md rounded-xl border border-blue-500/20 rotate-[5deg]" />
            
            {/* Main Avatar / 3D Person substitute */}
            <div className="relative z-10 text-center">
               <Image 
                 src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                 alt="Illustration"
                 width={280}
                 height={280}
                 className="drop-shadow-2xl opacity-90"
                 unoptimized
               />
            </div>

            {/* Status Badge */}
            <div className="absolute -bottom-6 -left-6 z-20 p-5 bg-white dark:bg-[#151E32] border border-white/10 rounded-2xl shadow-2xl flex items-center gap-4 w-[280px]">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase mb-1">{t('status.title')}</p>
                <p className="text-sm font-semibold text-emerald-400 mb-2">{t('status.offer')}</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== COMPANY TICKER ===== */}
      <section className="border-y border-slate-200 dark:border-white/5 bg-white/[0.02] py-8 overflow-hidden flex flex-col items-center">
        <p className="text-[10px] font-bold text-foreground0 tracking-widest uppercase mb-6">Nền tảng luyện phỏng vấn cho kỹ sư phần mềm</p>
        
        {/* Marquee Container */}
        <div className="flex overflow-hidden w-full max-w-[100vw]">
          <motion.div 
            className="flex items-center space-x-16 px-8 min-w-full"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {/* Double the list for seamless looping */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex space-x-16 items-center">
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">N*B</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">V*G</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">A*T GROUP</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">SH*PEE</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">T*K*</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">GR*B</span>
                <span className="text-2xl font-black text-slate-700/80 tracking-tighter">M*M*</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-6">
          
          {/* Card 1 - Nền tảng mock phỏng vấn */}
          <div className="lg:col-span-3 bg-white dark:bg-[#151E32] rounded-[2rem] p-8 lg:p-10 border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">Nền tảng mock phỏng vấn với AI</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-12">
              Luyện Behavioral, Technical, System Design và Coding với AI theo kịch bản thực tế. Mỗi phiên có điểm số và góp ý để bạn biết cần cải thiện gì.
            </p>
            
            {/* Terminal decoration */}
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-40 group-hover:opacity-60 transition-opacity">
              <div className="w-64 h-48 bg-slate-800 rounded-2xl border-4 border-slate-700 flex items-center justify-center">
                <Terminal className="w-24 h-24 text-foreground0" />
              </div>
            </div>

            <Link href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
              Mở phiên mock đầu tiên <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2 - Mock Job sát thực tế */}
          <div className="lg:col-span-2 bg-[#0C121F] rounded-[2rem] p-8 lg:p-10 border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
             <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Mock Job sát thực tế thị trường</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-12">
              Mỗi vị trí mock job được thiết kế để mô phỏng chính xác các vòng phỏng vấn thực tế tại các công ty IT ở Việt Nam, dựa trên kinh nghiệm thực chiến từ đội ngũ kỹ sư và founder của chúng tôi.
            </p>
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
              Xem vị trí mock <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3 - Phân tích */}
          <div className="lg:col-span-2 bg-white dark:bg-[#151E32] rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 mb-4 flex items-center">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Phân tích chuyên sâu</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Xem điểm theo từng năng lực và theo dõi tiến bộ qua thời gian để điều chỉnh kế hoạch luyện tập.
            </p>
          </div>

          {/* Card 4 - Kết nối Mentor */}
          <div className="lg:col-span-2 bg-blue-500 rounded-[2rem] p-8 border border-blue-400/50 hover:bg-blue-600 transition-colors shadow-[0_10px_40px_rgba(59,130,246,0.3)]">
            <div className="w-10 h-10 mb-4 flex items-center">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Kết nối Mentor</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Kết nối với mentor khi bạn cần phản hồi thực tế ngoài phần chấm điểm của AI.
            </p>
          </div>

          {/* Card 5 - Tăng tốc */}
          <div className="lg:col-span-1 bg-white dark:bg-[#151E32] rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 mb-4 flex items-center">
                <Rocket className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Tăng tốc</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Kế hoạch ngắn hạn cho giai đoạn cần tăng tốc trước lịch phỏng vấn thật.
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ===== JOURNEY SECTION ===== */}
      <section className="py-24 px-6 lg:px-12 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">Hành trình phỏng vấn của bạn</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-16">Phỏng vấn không phải một bài test một lần, mà là một quá trình luyện tập theo vòng</p>
        
        <div className="relative text-left max-w-2xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-800" />

          {/* Step 1 */}
          <div className="relative flex gap-8 mb-16 group">
            <div className="relative z-10 w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] shrink-0">
              01
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold text-blue-400 mb-2">Sàng lọc CV bằng AI</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Phân tích CV theo vị trí mục tiêu để biết khoảng cách hiện tại và việc cần ưu tiên.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex gap-8 mb-16 group">
            <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-[#151E32] border border-white/10 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400 shrink-0 group-hover:border-blue-500/50 group-hover:text-white transition-colors">
              02
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold mb-2">Thực chiến mọi vòng phỏng vấn chuyên sâu cùng AI</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Luyện phỏng vấn theo từng vòng với AI interviewer, có thể trả lời bằng text hoặc giọng nói.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex gap-8 mb-16 group">
            <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-[#151E32] border border-white/10 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400 shrink-0 group-hover:border-blue-500/50 group-hover:text-white transition-colors">
              03
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold mb-2">Chấm điểm & Đánh giá</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Nhận điểm số theo rubric và góp ý cụ thể để sửa nội dung trả lời, tư duy và cách trình bày.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex gap-8 group">
            <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-[#151E32] border border-emerald-500 flex items-center justify-center text-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Check className="w-6 h-6" />
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold text-emerald-500 mb-2">Nhận Offer</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Khi luyện đủ sâu và đủ đều, bạn tự tin hơn trong phỏng vấn thật và tăng xác suất nhận offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto flex flex-col items-center">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 text-blue-400 text-sm font-semibold rounded-full border border-blue-500/30 mb-8 hover:bg-blue-500/30 transition-colors">
          <Calendar className="w-4 h-4" /> Đặt lịch ngay
        </button>

        <div className="w-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(59,130,246,0.2)]">
          {/* Faint pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          
          <h2 className="text-3xl lg:text-5xl font-extrabold mb-6 relative z-10 text-white drop-shadow-sm">
            Bắt đầu luyện phỏng vấn một cách có hệ thống
          </h2>
          <p className="text-blue-100 mb-10 max-w-2xl mx-auto relative z-10 text-lg">
            Dùng AI để mock phỏng vấn mỗi tuần, đo tiến bộ rõ ràng, và nâng kỹ năng phỏng vấn theo từng vòng.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-lg">
              Bắt đầu miễn phí
            </button>
            <button className="px-8 py-4 bg-blue-800/40 border border-white/20 text-white font-bold rounded-full hover:bg-blue-800/60 transition-colors backdrop-blur-md">
              Xem vị trí mock
            </button>
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CARDS SECTION ===== */}
      <section className="py-12 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-6">
          
          {/* Left Card - Blue */}
          <div className="lg:col-span-3 bg-blue-600 rounded-[2rem] p-10 relative overflow-hidden flex flex-col justify-between min-h-[360px] shadow-[0_10px_40px_rgba(37,99,235,0.2)]">
            {/* Background Decorations */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none flex items-center justify-end pr-10">
               <Star className="w-64 h-64 text-white fill-current -rotate-12 translate-x-12 translate-y-12" />
               <div className="absolute right-12 bottom-16 flex items-center gap-2">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.02]0 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center -translate-y-8">
                   <User className="w-6 h-6 text-white" />
                 </div>
                 <div className="w-16 h-16 bg-white/90 shadow-xl rounded-xl flex items-center justify-center z-10">
                   <User className="w-8 h-8 text-blue-600" />
                 </div>
                 <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.02]0 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center -translate-y-8">
                   <User className="w-6 h-6 text-white" />
                 </div>
               </div>
            </div>

            <div className="relative z-10 max-w-md">
              <span className="inline-block px-3 py-1 bg-slate-50 dark:bg-white/[0.02]0 text-white text-[10px] font-bold rounded-full mb-6 uppercase tracking-wider backdrop-blur-sm">
                Tài nguyên cao cấp
              </span>
              <h3 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                Luyện tập cùng đội ngũ sáng lập MockITV.
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-8">
                Nhận phản hồi trực tiếp từ các Senior/Lead kỳ cựu tại các công ty công nghệ hàng đầu (top tier) về CV và kỹ năng kỹ thuật trước khi vào vòng mock.
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 text-sm font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg">
                Đặt lịch ngay
              </button>
            </div>
          </div>

          {/* Right Card - Green */}
          <div className="lg:col-span-2 bg-[#20C974] rounded-[2rem] p-10 flex flex-col justify-between shadow-[0_10px_40px_rgba(32,201,116,0.15)] text-[#0B1120]">
            <div>
              <div className="w-12 h-12 mb-6 opacity-80">
                <BadgeCheck className="w-10 h-10 text-[#0B1120] fill-[#0B1120]/10" />
              </div>
              <p className="text-xl font-bold leading-relaxed mb-8 italic">
                “Phỏng vấn vào công ty mơ ước là một hành trình dài. MockITV được tạo ra để đồng hành cùng bạn trên hành trình đó - từng buổi luyện tập, từng bước tiến nhỏ”
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#0B1120]/20 flex items-center justify-center">
                <UserCircle2 className="w-6 h-6 text-[#0B1120]/60" />
              </div>
              <div>
                <p className="text-sm font-bold">PhuongPV</p>
                <p className="text-xs font-semibold opacity-70">Founder @ MockITV</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
