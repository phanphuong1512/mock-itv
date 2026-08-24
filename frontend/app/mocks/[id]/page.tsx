'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Award, Building2, Clock, Layers, Zap, FileText, Upload, CheckCircle2, Play, Phone, Sparkles, ArrowLeft, Brain,
  Lock, X, QrCode, Copy, CheckCheck, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
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
  const { user, refreshUser, openLoginModal } = useAuth();
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [loadingFact, setLoadingFact] = useState(FUN_FACTS[0]);

  // Voice Cooldown & Upgrade Modal State
  const [voiceCooldownModal, setVoiceCooldownModal] = useState<{ hoursLeft: number; lastVoiceAt?: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePaymentOrder = async (planKey: 'pro' | 'premium') => {
    try {
      setLoadingPlan(planKey);
      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Không thể tạo mã thanh toán');
      }

      const data = await res.json();
      setPaymentInfo(data);
      setPaymentStatus('pending');

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollToken = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
          const statusRes = await fetch(`/api/payments/order-status/${data.order.orderCode}`, {
            headers: {
              ...(pollToken ? { 'Authorization': `Bearer ${pollToken}` } : {})
            }
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'completed') {
              setPaymentStatus('completed');
              clearInterval(pollIntervalRef.current);
              await refreshUser();
              setTimeout(() => {
                setShowUpgradeModal(false);
                setVoiceCooldownModal(null);
                setPaymentInfo(null);
                handleStartVoiceInterview();
              }, 1800);
            }
          }
        } catch (e) {
          console.error('Error polling payment', e);
        }
      }, 2000);
    } catch (err: any) {
      alert(`⚠️ Lỗi khởi tạo thanh toán:\n${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setLoadingPlan(null);
    }
  };

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

    const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
    if (!token && !user) {
      openLoginModal(
        () => handleStartInterview(),
        'Đăng nhập để bắt đầu phỏng vấn',
        'Đăng nhập bằng tài khoản Google để hệ thống khởi tạo câu hỏi và lưu trữ lịch sử đánh giá của bạn.'
      );
      return;
    }

    setIsStarting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = { job_id: currentJob.id, questions_count: currentJob.rounds || 7 };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (response.status === 401) {
        setIsStarting(false);
        openLoginModal(
          () => handleStartInterview(),
          'Phiên đăng nhập đã hết hạn',
          'Vui lòng đăng nhập lại với Google để tiếp tục.'
        );
        return;
      }
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Lỗi khởi tạo phiên phỏng vấn từ AI");
      }

      const data = await response.json();
      if (data && data.id) {
        router.push(`/interview/${data.id}`);
      } else {
        throw new Error("Không nhận được mã phiên phỏng vấn hợp lệ");
      }
    } catch (err: any) {
      console.error("Failed to start session", err);
      alert(`⚠️ Lỗi khởi động phỏng vấn:\n${err.message || 'Vui lòng kiểm tra lại kết nối AI.'}`);
      setIsStarting(false);
    }
  };

  const handleStartVoiceInterview = async () => {
    if (!currentJob) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
    if (!token && !user) {
      openLoginModal(
        () => handleStartVoiceInterview(),
        'Đăng nhập để phỏng vấn giọng nói',
        'Đăng nhập bằng tài khoản Google để trò chuyện tương tác 1-1 với AI qua giọng nói.'
      );
      return;
    }

    // Check 24h voice limit
    try {
      const checkRes = await fetch('/api/voice/check-limit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.status === 401) {
        openLoginModal(
          () => handleStartVoiceInterview(),
          'Phiên đăng nhập đã hết hạn',
          'Vui lòng đăng nhập lại với Google để tiếp tục.'
        );
        return;
      }
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.allowed) {
          if (checkData.reason === 'cooldown') {
            setVoiceCooldownModal({
              hoursLeft: checkData.hoursLeft || 24,
              lastVoiceAt: checkData.lastVoiceAt
            });
            return;
          }
        }
      }
    } catch (e) {
      console.error("Check voice limit error:", e);
    }

    setIsStarting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = { job_id: currentJob.id, questions_count: currentJob.rounds || 7 };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (response.status === 401) {
        setIsStarting(false);
        openLoginModal(
          () => handleStartVoiceInterview(),
          'Phiên đăng nhập đã hết hạn',
          'Vui lòng đăng nhập lại với Google để tiếp tục.'
        );
        return;
      }
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Lỗi khởi tạo phiên phỏng vấn từ AI");
      }

      // Record voice usage for 24h cooldown tracking
      fetch('/api/voice/record-usage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error("Record voice usage error:", err));

      const data = await response.json();
      if (data && data.id) {
        router.push(`/interview/${data.id}?mode=voice`);
      } else {
        throw new Error("Không nhận được mã phiên phỏng vấn hợp lệ");
      }
    } catch (err: any) {
      console.error("Failed to start voice session", err);
      alert(`⚠️ Lỗi khởi động phỏng vấn:\n${err.message || 'Vui lòng kiểm tra lại kết nối AI.'}`);
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

                  {/* Button 1: Text Interview */}
                  <button
                    onClick={handleStartInterview}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:to-red-650 text-white font-extrabold rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-white shrink-0" />
                    <span className="whitespace-nowrap">Phỏng vấn dạng text</span>
                  </button>

                  {/* Button 2: Voice Interview */}
                  <button
                    onClick={handleStartVoiceInterview}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Phỏng vấn giọng nói</span>
                  </button>

                  <div className="pt-3 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <Sparkles className="w-4 h-4 fill-emerald-500/10 shrink-0" />
                    <span>
                      {user?.plan === 'pro' || user?.plan === 'premium'
                        ? `Gói ${user.plan.toUpperCase()} (Không giới hạn)`
                        : 'Gói Miễn phí (1 lượt Voice/24h)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== VOICE COOLDOWN MODAL ===== */}
      <AnimatePresence>
        {voiceCooldownModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card-bg border border-foreground/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative text-center space-y-6"
            >
              <button
                onClick={() => setVoiceCooldownModal(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground">
                  Đã dùng hết lượt Voice hôm nay
                </h3>
                <p className="text-xs text-foreground/70 leading-relaxed max-w-sm mx-auto">
                  Gói Miễn phí được tặng <strong>1 lượt phỏng vấn giọng nói mỗi 24 giờ</strong>. Lượt miễn phí tiếp theo của bạn sẽ mở lại sau khoảng <strong>{voiceCooldownModal.hoursLeft} giờ</strong> nữa.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-left flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-normal">
                  Bạn vẫn có thể tiếp tục <strong>Phỏng vấn dạng Text không giới hạn</strong>, hoặc nâng cấp Pro để mở khóa Voice AI 24/7!
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    setVoiceCooldownModal(null);
                    setShowUpgradeModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Nâng cấp gói Pro (Chỉ 99k / Voice không giới hạn)
                </button>

                <button
                  onClick={() => {
                    setVoiceCooldownModal(null);
                    handleStartInterview();
                  }}
                  className="w-full py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Tiếp tục với Phỏng vấn Text (Miễn phí)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== UPGRADE MODAL POPUP ===== */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-card-bg border border-foreground/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden"
            >
              <button
                onClick={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setShowUpgradeModal(false);
                  setPaymentInfo(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {paymentInfo ? (
                paymentStatus === 'completed' ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                      <CheckCheck className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-foreground mb-1">
                        Kích hoạt thành công! 🎉
                      </h3>
                      <p className="text-sm text-foreground/70">
                        Đang chuẩn bị vào buổi phỏng vấn giọng nói của bạn...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <QrCode className="w-3.5 h-3.5" />
                        VietQR SePay Thanh Toán Tự Động
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground">
                        Quét mã để nâng cấp gói {paymentInfo.bankInfo.planName}
                      </h3>
                      <p className="text-xs text-foreground/60 mt-1">
                        Hệ thống tự động kích hoạt gói sau khi nhận chuyển khoản (1 - 3 giây)
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner mb-6">
                      <img
                        src={paymentInfo.qrUrl}
                        alt="VietQR Payment"
                        className="w-48 h-48 object-contain"
                      />
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">
                        Mở app ngân hàng bất kỳ để quét mã VietQR
                      </span>
                    </div>

                    <div className="bg-foreground/5 rounded-2xl p-4 space-y-2 text-xs font-medium mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/60">Ngân hàng:</span>
                        <span className="font-bold text-foreground">{paymentInfo.bankInfo.bankName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/60">Chủ tài khoản:</span>
                        <span className="font-bold text-foreground">{paymentInfo.bankInfo.accountName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/60">Số tài khoản:</span>
                        <button
                          onClick={() => handleCopy(paymentInfo.bankInfo.accountNo, 'acc')}
                          className="flex items-center gap-1 font-bold text-foreground hover:text-blue-500 transition-colors"
                        >
                          <span>{paymentInfo.bankInfo.accountNo}</span>
                          {copiedField === 'acc' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/60">Số tiền:</span>
                        <button
                          onClick={() => handleCopy(paymentInfo.bankInfo.amount.toString(), 'amount')}
                          className="flex items-center gap-1 font-extrabold text-blue-500 hover:opacity-80 transition-opacity text-sm"
                        >
                          <span>{paymentInfo.bankInfo.amount.toLocaleString('vi-VN')} đ</span>
                          {copiedField === 'amount' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
                        <span className="text-foreground/60">Nội dung chuyển khoản:</span>
                        <button
                          onClick={() => handleCopy(paymentInfo.bankInfo.orderCode, 'code')}
                          className="flex items-center gap-1 font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
                        >
                          <span>{paymentInfo.bankInfo.orderCode}</span>
                          {copiedField === 'code' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-foreground/70">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Đang chờ xác nhận chuyển khoản từ SePay...</span>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                      <Zap className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">
                      Nâng cấp Gói để mở khóa Voice AI
                    </h3>
                    <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto leading-relaxed">
                      Luyện phản xạ phỏng vấn bằng giọng nói tương tác thời gian thực không giới hạn với AI.
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div
                      onClick={() => handleCreatePaymentOrder('pro')}
                      className="p-4 rounded-2xl border-2 border-blue-500/40 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">Gói Pro (Phổ biến)</span>
                          <span className="text-[10px] font-black uppercase bg-gradient-to-r from-red-500 to-amber-500 text-white px-2 py-0.5 rounded-full">🔥 Giảm 80%: 19k</span>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1">30 lượt mock, Voice AI không giới hạn, Custom CV/JD</p>
                      </div>
                      <button
                        disabled={loadingPlan === 'pro'}
                        className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl group-hover:bg-blue-600 transition-colors shrink-0"
                      >
                        {loadingPlan === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chọn gói'}
                      </button>
                    </div>

                    <div
                      onClick={() => handleCreatePaymentOrder('premium')}
                      className="p-4 rounded-2xl border border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">Gói Premium VIP</span>
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">🔥 Giảm 80%: 39k</span>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1">100 lượt mock, Ưu tiên server AI cao nhất 24/7</p>
                      </div>
                      <button
                        disabled={loadingPlan === 'premium'}
                        className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl group-hover:bg-amber-600 transition-colors shrink-0"
                      >
                        {loadingPlan === 'premium' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chọn gói'}
                      </button>
                    </div>
                  </div>



                  <div className="text-center pt-2 border-t border-foreground/10">
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        router.push('/pricing');
                      }}
                      className="text-xs text-blue-500 hover:underline font-semibold cursor-pointer"
                    >
                      Xem chi tiết bảng so sánh tính năng đầy đủ →
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

