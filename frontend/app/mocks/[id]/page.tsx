'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Award, Building2, Clock, Layers, Zap, FileText, Upload, CheckCircle2, Play, Phone, Sparkles, ArrowLeft, Brain
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { JobResponse } from '@/types/api';

const FUN_FACTS = [
  "Bạn có biết: 80% ứng viên cảm thấy tự tin hơn sau khi phỏng vấn thử với AI?",
  "AI đang trích xuất các kỹ năng từ yêu cầu để tạo bộ câu hỏi sát nhất...",
  "Tip: Phương pháp STAR (Situation, Task, Action, Result) rất hiệu quả cho câu hỏi Behavioral.",
  "Đang khởi tạo phiên phỏng vấn mới, chuẩn bị môi trường đánh giá khách quan nhất...",
  "Bạn có thể sử dụng tính năng 'Phỏng vấn giọng nói' để luyện phản xạ giao tiếp trôi chảy hơn."
];

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'fullstack', label: 'Fullstack' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'devops', label: 'DevOps' },
  { id: 'data-engineer', label: 'Data Engineer' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'ai-ml', label: 'AI / ML' },
  { id: 'security', label: 'Security' },
  { id: 'qa', label: 'QA / Testing' },
  { id: 'embedded', label: 'Embedded' },
  { id: 'blockchain', label: 'Blockchain' },
  { id: 'gamedev', label: 'Game Dev' },
];

export default function MockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [loadingFact, setLoadingFact] = useState(FUN_FACTS[0]);

  useEffect(() => {
    let interval: any;
    if (isStarting) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % FUN_FACTS.length;
        setLoadingFact(FUN_FACTS[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isStarting]);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const job = data.find((j: JobResponse) => j.id === parseInt(resolvedParams.id));
          setCurrentJob(job || null);
        }
      })
      .catch((err) => console.error("Failed to fetch job", err));
  }, [resolvedParams.id]);

  const handleStartInterview = async () => {
    if (!currentJob) return;
    setIsStarting(true);
    try {
      const body: any = { job_id: currentJob.id, questions_count: currentJob.rounds || 7 };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data && data.id) {
        router.push(`/interview/${data.id}`);
      } else {
        throw new Error("Invalid session created");
      }
    } catch (err) {
      console.error("Failed to start session", err);
      alert("Đã xảy ra lỗi khi tạo session. Vui lòng thử lại.");
      setIsStarting(false);
    }
  };

  const handleStartVoiceInterview = async () => {
    if (!currentJob) return;
    setIsStarting(true);
    try {
      const body: any = { job_id: currentJob.id, questions_count: currentJob.rounds || 7 };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data && data.id) {
        router.push(`/interview/${data.id}?mode=voice`);
      } else {
        throw new Error("Invalid session created");
      }
    } catch (err) {
      console.error("Failed to start session", err);
      alert("Đã xảy ra lỗi khi tạo session. Vui lòng thử lại.");
      setIsStarting(false);
    }
  };

  const getQuestionTagLabel = (index: number) => {
    if (index === 2) return "problem-solving";
    if (index === 4) return "behavioral";
    return "technical";
  };

  if (!currentJob) return <div className="min-h-screen bg-background pt-24 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col relative">
      <Navbar />


      <div className="pt-24 pb-8 flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
          {isStarting ? (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-lg w-full text-center space-y-8 mx-auto"
            >
              {/* Massive glowing orb with spinner */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="w-10 h-10 text-blue-400 relative z-10" />
              </div>

              {/* Status Message */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white">Đang khởi tạo phỏng vấn</h3>
                <p className="text-sm text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                  Quá trình này có thể mất vài giây để AI tổng hợp dữ liệu...
                </p>
              </div>

              {/* Tips / Fun fact card */}
              <div className="bg-[#151E32]/30 border border-white/5 rounded-3xl p-5 w-full text-left space-y-2">
                <span className="text-[10px] font-bold text-blue-450 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-blue-500/10" />
                  Bạn có biết?
                </span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingFact}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed min-h-[40px]"
                  >
                    {loadingFact}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-6xl px-6 lg:px-12 flex flex-col"
          >
            <div className="mb-6 self-start">
              <button
                onClick={() => router.push('/mocks')}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 font-extrabold transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách vị trí
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-md space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {currentJob.level}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-blue-500/20">
                      {CATEGORIES.find(c => c.id === currentJob.category)?.label || currentJob.category}
                    </span>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                    Lập trình viên {currentJob.title} - Phỏng vấn Technical
                  </h1>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {currentJob.company}
                  </p>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">
                    Đánh giá chuyên sâu kiến thức chuyên môn và khả năng tư duy giải quyết vấn đề thực tế liên quan đến: {currentJob.techStack?.join(', ')}. Bài mock được thiết kế chuẩn cấu trúc phỏng vấn tại các doanh nghiệp công nghệ lớn.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentJob.techStack?.map((tech: string) => (
                      <span key={tech} className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info Boxes */}
                <div className="space-y-4">
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">Chi tiết phỏng vấn</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Thời lượng</span>
                        <span className="text-sm font-black">{(currentJob.rounds || 7) * 5} phút</span>
                      </div>
                    </div>
                    <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tổng câu hỏi</span>
                        <span className="text-sm font-black">{currentJob.rounds || 7} câu hỏi</span>
                      </div>
                    </div>
                    <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Điểm đạt</span>
                        <span className="text-sm font-black">65%</span>
                      </div>
                    </div>
                    <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">XP Thưởng</span>
                        <span className="text-sm font-black">150 XP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">Cấu trúc các vòng phỏng vấn</h2>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {Array.from({ length: currentJob.rounds || 7 }).map((_, idx) => {
                      const tag = getQuestionTagLabel(idx);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group">
                          <div className="flex items-center gap-3.5">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold flex items-center justify-center text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              {idx + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                              tag === 'technical' 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                : tag === 'behavioral'
                                ? 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {tag}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-semibold">3 phút</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4">
                <div className="sticky top-24 bg-gradient-to-br from-[#0B1120] to-[#151E32] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-xl rounded-full" />
                  
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-md">
                    <Play className="w-8 h-8 fill-orange-500/20" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">Sẵn sàng bắt đầu?</h3>
                    <p className="text-sm text-slate-400 font-medium">
                      {currentJob.rounds || 7} câu hỏi đang đợi bạn
                    </p>
                  </div>

                  <button
                    onClick={handleStartInterview}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:to-red-650 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Bắt đầu phỏng vấn
                  </button>

                  <button
                    onClick={handleStartVoiceInterview}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Phỏng vấn giọng nói
                  </button>

                  <div className="pt-4 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <Sparkles className="w-4 h-4 fill-emerald-500/10" />
                    PhuongPV Premium (Không giới hạn)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
}
