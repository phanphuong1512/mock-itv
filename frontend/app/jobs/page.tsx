'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { 
  Info, Server, Monitor, Layers, Smartphone, Infinity as InfinityIcon, 
  Database, LineChart, Brain, Shield, CheckCircle, Cpu, Link as LinkIcon, 
  Gamepad2, Building2, Briefcase, MapPin, Clock, ArrowRight,
  ArrowLeft, Play, Zap, Award, Sparkles, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: null },
  { id: 'backend', label: 'Backend', icon: Server },
  { id: 'frontend', label: 'Frontend', icon: Monitor },
  { id: 'fullstack', label: 'Fullstack', icon: Layers },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'devops', label: 'DevOps', icon: InfinityIcon },
  { id: 'data-engineer', label: 'Data Engineer', icon: Database },
  { id: 'data-science', label: 'Data Science', icon: LineChart },
  { id: 'ai-ml', label: 'AI / ML', icon: Brain },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'qa', label: 'QA / Testing', icon: CheckCircle },
  { id: 'embedded', label: 'Embedded', icon: Cpu },
  { id: 'blockchain', label: 'Blockchain', icon: LinkIcon },
  { id: 'gamedev', label: 'Game Dev', icon: Gamepad2 },
];

const LEVELS = [
  'Tất cả', 'Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead', 'Principal', 'Manager'
];

export default function JobsPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('Tất cả');
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [view, setView] = useState<'list' | 'detail' | 'interview' | 'loading'>('list');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [interviewTimer, setInterviewTimer] = useState(0);
  const [loadingStepText, setLoadingStepText] = useState('Đang khởi tạo buổi phỏng vấn...');

  // Fetch jobs from backend API
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            category: j.category,
            level: j.level,
            techStack: j.techStack || [],
            rounds: j.rounds,
            logo: j.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${j.company}&backgroundColor=0B1120`,
          })));
        }
      })
      .catch((err) => {
        console.error("Backend error or connection failed:", err);
      });
  }, []);

  // Timer Effect for Live Interview
  useEffect(() => {
    let timerId: any;
    if (view === 'interview') {
      timerId = setInterval(() => {
        setInterviewTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [view]);

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchCategory = activeCategory === 'all' || job.category === activeCategory;
    const matchLevel = activeLevel === 'Tất cả' || job.level === activeLevel;
    return matchCategory && matchLevel;
  });

  const currentJob = jobs.find(j => j.id === selectedJobId);

  const handleStartInterview = async () => {
    if (!selectedJobId) return;
    setView('loading');
    setLoadingStepText('Đang kết nối với PhuongPV AI và sinh câu hỏi...');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId, questions_count: currentJob?.rounds || 7 })
      });
      const data = await response.json();
      if (data && data.id) {
        setCurrentSessionId(data.id);
        setSessionQuestions(data.questions || []);
        setCurrentQuestionIndex(0);
        setUserAnswerText('');
        setInterviewTimer(0);
        setView('interview');
      } else {
        throw new Error("Invalid session created");
      }
    } catch (err) {
      console.warn("[Interview] API start failed, using high-fidelity fallback questions.", err);
      // Fallback questions if backend API fails
      const fallbackQuestions = Array.from({ length: currentJob?.rounds || 7 }).map((_, idx) => ({
        id: idx + 1,
        questionOrder: idx + 1,
        tag: idx === 2 ? 'problem-solving' : idx === 4 ? 'behavioral' : 'technical',
        questionText: idx === 0 
          ? `Hãy giới thiệu bản thân và nêu bật một dự án nổi bật nhất liên quan đến ${currentJob?.techStack.slice(0, 2).join(', ') || 'công nghệ chính'} mà bạn từng làm.`
          : idx === 1
          ? `Hãy giải thích chi tiết cơ chế hoạt động, ưu & nhược điểm của việc ứng dụng ${currentJob?.techStack[0] || 'công nghệ của bạn'} trong hệ thống thực tế.`
          : idx === 2
          ? `Với vị trí ${currentJob?.title}, làm sao để thiết kế hệ thống đảm bảo hiệu năng cao, chịu tải tốt (High Availability) khi có lượng traffic tăng đột biến?`
          : idx === 3
          ? `Kể lại một lần bạn gặp xung đột kỹ thuật với đồng nghiệp hoặc sếp. Bạn đã xử lý và thuyết phục họ như thế nào để đi đến kết quả cuối cùng?`
          : `Giải thích chi tiết sự khác biệt giữa hai công nghệ/phương pháp tiếp cận phổ biến trong ${currentJob?.category === 'backend' ? 'Backend' : 'Frontend'} và khi nào nên dùng từng loại.`
      }));
      setSessionQuestions(fallbackQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswerText('');
      setInterviewTimer(0);
      setView('interview');
    }
  };

  const handleSubmitAnswer = async () => {
    const currentQ = sessionQuestions[currentQuestionIndex];
    if (!currentQ) return;

    // Call submit endpoint if sessionId exists
    if (currentSessionId) {
      try {
        await fetch(`/api/sessions/${currentSessionId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: currentQ.id, answer: userAnswerText })
        });
      } catch (err) {
        console.error("Failed to submit answer to API:", err);
      }
    }

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswerText('');
    } else {
      handleEvaluateSession();
    }
  };

  const handleEvaluateSession = async () => {
    setView('loading');
    setLoadingStepText('Đang nộp bài làm của bạn...');
    
    // Simulate steps for beautiful AI loading assessment
    const steps = [
      'Đang nộp bài làm của bạn...',
      'Google Gemini AI đang phân tích toàn bộ câu trả lời...',
      'Đang chấm điểm và gán mã màu (Xanh/Vàng/Đỏ) cho các ý đúng/sai...',
      'Đang tổng hợp ưu điểm & các điểm cần cải thiện...',
      'Đang thiết lập chủ đề ôn tập gợi ý và tài liệu tham khảo...',
      'Hoàn tất! Đang chuẩn bị chuyển hướng bạn đến trang kết quả chi tiết...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStepText(steps[stepIdx]);
      }
    }, 2200);

    if (currentSessionId) {
      try {
        const res = await fetch(`/api/sessions/${currentSessionId}/evaluate`, {
          method: 'POST'
        });
        if (res.ok) {
          clearInterval(interval);
          setLoadingStepText('Phân tích hoàn tất! Đang mở bảng điểm của bạn...');
          setTimeout(() => {
            window.location.href = '/history';
          }, 1000);
          return;
        }
      } catch (err) {
        console.error("API evaluate failed", err);
      }
    }

    // Fallback loading simulation
    setTimeout(() => {
      clearInterval(interval);
      window.location.href = '/history';
    }, 11000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTagLabel = (index: number) => {
    if (index === 2) return "problem-solving";
    if (index === 4) return "behavioral";
    return "technical";
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-8 flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
          {/* ==========================================
              VIEW 1: JOB LISTINGS (SEARCH & GRID)
             ========================================== */}
          {view === 'list' && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center"
            >
              {/* Header Title */}
              <section className="px-6 lg:px-12 text-center max-w-4xl w-full">
                <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight text-blue-500">
                  Vị trí mô phỏng tuyển dụng
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-base mb-4 max-w-2xl mx-auto">
                  Chọn vị trí mong muốn của bạn để phỏng vấn thử 1-1 với PhuongPV AI, nhận đánh giá chi tiết từng câu trả lời.
                </p>
                
                <div className="flex items-start justify-center gap-2 mx-auto max-w-3xl text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed mb-8">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-center">
                    Lưu ý: Tất cả các job dùng cho mock interview đều được xây dựng dựa trên quá trình tổng hợp và đánh giá độc lập từ đội ngũ admin, nhằm mô phỏng sát nhất trải nghiệm phỏng vấn thực tế. Các nội dung này không xuất phát từ bất kỳ nguồn nội bộ, thông tin rò rỉ (leak), hay sự liên kết chính thức nào với các công ty được đề cập.
                  </p>
                </div>
              </section>

              {/* Filters */}
              <section className="px-6 lg:px-12 max-w-5xl w-full flex flex-col items-center mb-8">
                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-4xl">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all border border-transparent ${
                          isActive 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-slate-100 dark:bg-[#151E32] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Level Filters */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-4">
                  <span className="uppercase tracking-widest opacity-60 mr-2">Cấp bậc</span>
                  {LEVELS.map(level => {
                    const isActive = activeLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setActiveLevel(level)}
                        className={`px-3 py-1 rounded-full transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                
                {/* Results Info */}
                <div className="w-full text-left pb-2 max-w-6xl">
                  <p className="text-sm font-bold text-slate-650 dark:text-slate-350">
                    {filteredJobs.length} vị trí <span className="text-blue-500">- {activeLevel !== 'Tất cả' ? activeLevel : 'Tất cả'} / {CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
                  </p>
                </div>
              </section>

              {/* Job Grid */}
              <section className="px-6 lg:px-12 max-w-6xl w-full">
                {filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {filteredJobs.map(job => (
                      <motion.div 
                        key={job.id}
                        whileHover={{ y: -5, scale: 1.01 }}
                        onClick={() => { setSelectedJobId(job.id); setView('detail'); }}
                        className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[240px] group hover:border-blue-500/50 hover:shadow-xl transition-all shadow-sm overflow-hidden cursor-pointer"
                      >
                        {/* Top Header */}
                        <div className="flex items-start justify-between mb-2 shrink-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1.5">
                            <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-blue-500/10 text-slate-750 dark:text-blue-400 text-[9px] font-extrabold uppercase tracking-wider rounded-md border border-slate-200 dark:border-blue-500/20">
                              {CATEGORIES.find(c => c.id === job.category)?.label || job.category}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-750 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider rounded-md border border-emerald-200 dark:border-emerald-500/20">
                              {job.level}
                            </span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                          <h3 className="text-base font-black mb-1 leading-normal group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2 py-1">
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-450 font-medium mb-3 flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{job.company}</span>
                          </p>

                          <div className="flex flex-wrap gap-1.5 overflow-hidden">
                            {job.techStack.map(tech => (
                              <span key={tech} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Footer */}
                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {job.rounds} vòng phỏng vấn
                          </div>
                          <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-slate-500 dark:text-slate-450 text-sm">Không tìm thấy vị trí nào phù hợp với bộ lọc của bạn.</p>
                    <button 
                      onClick={() => { setActiveCategory('all'); setActiveLevel('Tất cả'); }}
                      className="mt-4 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-full transition-all"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* ==========================================
              VIEW 2: DETAILED SETUP & OVERVIEW PANEL
             ========================================== */}
          {view === 'detail' && currentJob && (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl px-6 lg:px-12 flex flex-col"
            >
              {/* Back breadcrumb */}
              <div className="mb-6 self-start">
                <button 
                  onClick={() => { setSelectedJobId(null); setView('list'); }}
                  className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 font-extrabold transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại danh sách vị trí
                </button>
              </div>

              {/* Main setup columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                {/* Left: Info */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Hero card details */}
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
                      Đánh giá chuyên sâu kiến thức chuyên môn và khả năng tư duy giải quyết vấn đề thực tế liên quan đến: {currentJob.techStack.join(', ')}. Bài mock được thiết kế chuẩn cấu trúc phỏng vấn tại các doanh nghiệp công nghệ lớn.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentJob.techStack.map(tech => (
                        <span key={tech} className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chi tiết phỏng vấn bento spec boxes */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">Chi tiết phỏng vấn</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Box 1 */}
                      <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Thời lượng</span>
                          <span className="text-sm font-black">30 phút</span>
                        </div>
                      </div>
                      {/* Box 2 */}
                      <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tổng câu hỏi</span>
                          <span className="text-sm font-black">{currentJob.rounds || 7} câu hỏi</span>
                        </div>
                      </div>
                      {/* Box 3 */}
                      <div className="bg-[#151E32]/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Điểm đạt</span>
                          <span className="text-sm font-black">65%</span>
                        </div>
                      </div>
                      {/* Box 4 */}
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

                  {/* Vòng câu hỏi outline lists */}
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

                {/* Right: Sẵn sàng bắt đầu card */}
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

                    <div className="pt-4 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <Sparkles className="w-4 h-4 fill-emerald-500/10" />
                      PhuongPV Premium (Không giới hạn)
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              VIEW 3: LIVE INTERACTIVE INTERVIEW PANEL
             ========================================== */}
          {view === 'interview' && (
            <motion.div
              key="interview-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl px-6 flex flex-col gap-6"
            >
              {/* Header: Progress, index, timer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
                <div className="space-y-1 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-slate-400">
                      Câu hỏi {currentQuestionIndex + 1} / {sessionQuestions.length}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      getQuestionTagLabel(currentQuestionIndex) === 'technical'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                        : getQuestionTagLabel(currentQuestionIndex) === 'behavioral'
                        ? 'bg-amber-500/15 text-amber-450 border border-amber-500/20'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {getQuestionTagLabel(currentQuestionIndex)}
                    </span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full sm:w-64 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / sessionQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#151E32] border border-slate-200 dark:border-white/5 rounded-2xl font-mono text-sm font-bold text-slate-700 dark:text-blue-400 shadow-inner">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-blue-500" />
                  {formatTimer(interviewTimer)}
                </div>
              </div>

              {/* Question Text block */}
              <div className="bg-gradient-to-r from-blue-900/10 to-transparent border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 blur-xl rounded-full" />
                <h2 className="text-lg lg:text-xl font-bold leading-relaxed text-slate-800 dark:text-white relative z-10">
                  {sessionQuestions[currentQuestionIndex]?.questionText}
                </h2>
              </div>

              {/* Input section (Textarea) */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  Nhập câu trả lời của bạn
                </label>
                <textarea
                  value={userAnswerText}
                  onChange={(e) => setUserAnswerText(e.target.value)}
                  placeholder="Hãy trả lời chi tiết và mạch lạc các ý của bạn ở đây. AI sẽ phân tích dựa trên toàn bộ câu từ bạn đã viết..."
                  className="w-full min-h-[220px] p-5 bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-550 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm sm:text-base leading-relaxed resize-y shadow-inner"
                  autoFocus
                />
                
                {/* Character count / tips */}
                <div className="flex items-center justify-between text-xs text-slate-450 dark:text-slate-500 font-semibold px-2">
                  <span>💡 Tip: Giải thích chi tiết, thêm ví dụ cụ thể sẽ tăng điểm số đánh giá.</span>
                  <span>{userAnswerText.length} ký tự</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button 
                  onClick={() => {
                    setUserAnswerText('Tôi chưa có câu trả lời chi tiết cho phần này, xin phép bỏ qua.');
                    setTimeout(() => handleSubmitAnswer(), 50);
                  }}
                  className="px-6 py-3 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 font-bold rounded-2xl text-xs transition-all active:scale-95"
                >
                  Bỏ qua câu này
                </button>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswerText.trim()}
                  className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                >
                  {currentQuestionIndex === sessionQuestions.length - 1 ? 'Hoàn tất phỏng vấn ✨' : 'Nộp & Tiếp tục →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              VIEW 4: IMMERSIVE AI LOADER SCREEN
             ========================================== */}
          {view === 'loading' && (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-lg w-full text-center space-y-8"
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
                <h3 className="text-xl font-black text-white">Đang xử lý kết quả</h3>
                <p className="text-sm text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                  {loadingStepText}
                </p>
              </div>

              {/* Tips / Fun fact card */}
              <div className="bg-[#151E32]/30 border border-white/5 rounded-3xl p-5 w-full text-left space-y-2">
                <span className="text-[10px] font-bold text-blue-450 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-blue-500/10" />
                  Bạn có biết?
                </span>
                <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                  FastAPI backend của MockITV áp dụng cơ chế đánh giá song song (Batching). Từng câu trả lời của bạn được AI chấm đồng thời để trả về kết quả phân tích gán nhãn màu sắc chỉ trong chưa đầy 10 giây!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
