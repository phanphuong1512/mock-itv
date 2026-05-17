'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  XCircle, CheckCircle2, Lightbulb, Sparkles, ChevronDown, ChevronUp,
  BookOpen, ExternalLink, RotateCcw, Compass, Search, AlertTriangle, ArrowRight, Calendar, User,
  ArrowLeft, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Radial Progress Component ---
const RadialProgress = ({ value, label, size = 120, strokeWidth = 10, colorClass = "stroke-blue-500" }: any) => {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const targetOffset = circumference - (value / 100) * circumference;
    setTimeout(() => setOffset(targetOffset), 100);
  }, [value, circumference]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform origin-center drop-shadow-sm">
          <circle
            cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-800 fill-none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
            className={`fill-none ${colorClass} transition-all duration-1000 ease-out`} 
            strokeLinecap="round"
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset: offset === 0 ? circumference : offset 
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tracking-tight">{value}%</span>
        </div>
      </div>
      {label && <span className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>}
    </div>
  );
};

// --- Types & Data Interfaces ---
interface HighlightItem {
  id: string;
  text: string;
  type: 'success' | 'warning' | 'danger' | 'normal';
  popupTitle?: string;
  popupDesc?: string;
  statusText?: string;
}

interface QuestionDetail {
  id: number;
  text: string;
  tag: string;
  score: number;
  questionText?: string;
  userAnswer?: string;
  feedbackChunks?: HighlightItem[];
  analysisChunks?: HighlightItem[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

interface CompletedMock {
  id: number;
  position: string;
  department: string;
  level: string;
  company: string;
  techStack: string[];
  date: string;
  questionsCount: number;
  score: number;
}

export default function HistoryPage() {
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightItem | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [mocks, setMocks] = useState<CompletedMock[]>([]);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [sessionDetail, setSessionDetail] = useState<any>(null);

  // Fetch sessions list from backend
  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMocks(data.map((s: any) => ({
            id: s.id,
            position: s.position,
            department: s.department,
            level: s.level,
            company: s.company,
            techStack: s.techStack || [],
            date: s.date,
            questionsCount: s.questionsCount,
            score: s.score,
          })));
        }
      })
      .catch((err) => {
        console.error("Backend error or connection failed:", err);
      });
  }, []);

  // Fetch session detail when a mock is selected
  useEffect(() => {
    if (selectedMockId === null) {
      setSessionDetail(null);
      setQuestions([]);
      return;
    }
    fetch(`/api/sessions/${selectedMockId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.questions) {
          setSessionDetail(data);
          setQuestions(data.questions.map((q: any) => ({
            id: q.id,
            text: q.text || `Câu hỏi ${q.id}`,
            tag: q.tag,
            score: q.score,
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            analysisChunks: q.analysisChunks,
            feedbackChunks: q.feedbackChunks,
            strengths: q.strengths,
            weaknesses: q.weaknesses,
            recommendations: q.recommendations,
          })));
        }
      })
  }, [selectedMockId]);

  const currentMockDetails: any = sessionDetail
    ? {
        position: sessionDetail.position,
        company: sessionDetail.company,
        date: sessionDetail.date,
        score: sessionDetail.score,
        technicalScore: sessionDetail.technicalScore,
        communicationScore: sessionDetail.communicationScore,
        problemSolvingScore: sessionDetail.problemSolvingScore,
        aiOverallFeedback: sessionDetail.aiOverallFeedback,
        strengths: sessionDetail.strengths,
        weaknesses: sessionDetail.weaknesses,
        topicsToLearn: sessionDetail.topicsToLearn,
        resources: sessionDetail.resources,
      }
    : mocks.find(m => m.id === selectedMockId);

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setActiveHighlight(null);
    }
  };

  const handleHighlightClick = (item: HighlightItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'normal') return;
    setActiveHighlight(item);
  };

  const getHighlightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100/70 hover:bg-emerald-200/80 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/35 text-emerald-800 dark:text-emerald-300 border-b-2 border-emerald-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      case 'warning':
        return 'bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-500/20 dark:hover:bg-amber-500/35 text-amber-800 dark:text-amber-300 border-b-2 border-amber-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      case 'danger':
        return 'bg-rose-100/70 hover:bg-rose-200/80 dark:bg-rose-500/20 dark:hover:bg-rose-500/35 text-rose-800 dark:text-rose-300 border-b-2 border-rose-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      default:
        return '';
    }
  };

  const getPopupColor = (type: string) => {
    switch (type) {
      case 'success':
        return { border: 'border-emerald-500/30', header: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'warning':
        return { border: 'border-amber-500/30', header: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'danger':
        return { border: 'border-rose-500/30', header: 'text-rose-500', bg: 'bg-rose-500/10' };
      default:
        return { border: 'border-white/10', header: 'text-white', bg: 'bg-slate-900/10' };
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />
      
      {/* ===== PERSISTENT CENTERED MODAL FOR FEEDBACK HIGHLIGHTS ===== */}
      <AnimatePresence>
        {activeHighlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`bg-white dark:bg-[#0B1120] border ${getPopupColor(activeHighlight.type).border} rounded-2xl p-6 shadow-2xl w-full max-w-lg relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${activeHighlight.type === 'success' ? 'bg-emerald-500' : activeHighlight.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />

              <div className="flex items-center justify-between mb-4">
                <span className={`text-base font-extrabold uppercase tracking-widest flex items-center gap-2 ${getPopupColor(activeHighlight.type).header}`}>
                  {activeHighlight.type === 'danger' && <XCircle className="w-5 h-5" />}
                  {activeHighlight.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                  {activeHighlight.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {activeHighlight.popupTitle}
                </span>
                <button 
                  onClick={() => setActiveHighlight(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cụm từ được đánh giá</span>
                  <p className="text-base text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    "{activeHighlight.text}"
                  </p>
                </div>

                {activeHighlight.popupDesc && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Chi tiết nhận xét</span>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeHighlight.popupDesc}
                    </p>
                  </div>
                )}

                {activeHighlight.statusText && (
                  <div className={`p-4 rounded-xl border ${getPopupColor(activeHighlight.type).bg} ${getPopupColor(activeHighlight.type).border}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${getPopupColor(activeHighlight.type).header}`}>Gợi ý cải thiện</span>
                    <p className="text-sm sm:text-base font-bold leading-relaxed text-slate-800 dark:text-white">
                      {activeHighlight.statusText}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-12 flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12">
        
        <AnimatePresence mode="wait">
          {selectedMockId === null ? (
            
            // ==========================================
            // VIEW 1: COMPLETED MOCK TESTS LIST (5:3 RATIO RECTANGLES)
            // ==========================================
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Header Title */}
              <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-8">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-2">Lịch sử Mock của tôi</h1>
                  <p className="text-slate-500 dark:text-slate-450 text-base">
                    Theo dõi, ôn tập và xem lại kết quả phỏng vấn giả lập của bạn với PhuongPV AI.
                  </p>
                </div>

                {/* Dashboard Stats badge */}
                <div className="flex items-center gap-4 bg-card-bg border border-slate-200 dark:border-white/5 px-6 py-3.5 rounded-2xl shadow-sm self-center md:self-auto">
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đã luyện tập</span>
                    <span className="text-xl font-black text-blue-500">{mocks.length} bài Mock</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đạt yêu cầu</span>
                    <span className="text-xl font-black text-emerald-500">{mocks.filter(m => m.score >= 50).length} / {mocks.length}</span>
                  </div>
                </div>
              </div>

              {/* Mock List grid of horizontal cards (5:3 ratio) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mocks.map((mock) => (
                  <motion.div
                    key={mock.id}
                    whileHover={{ y: -6, scale: 1.01 }}
                    onClick={() => setSelectedMockId(mock.id)}
                    className="relative bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-blue-500/35 dark:hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[250px] overflow-hidden"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {mock.date}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                            {mock.department}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                            {mock.level}
                          </span>
                        </div>
                      </div>
                      
                      {/* Job Title */}
                      <h3 className="text-lg font-black group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                        {mock.position}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-450 mb-4">{mock.company}</p>

                      {/* Tech stack tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mock.techStack.map((tech, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-350 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-transparent">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer scores / info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">
                          {mock.questionsCount} câu hỏi
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${mock.score < 40 ? 'bg-red-500' : mock.score < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-bold text-slate-500">
                            Điểm: {mock.score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
          ) : (
            
            // ==========================================
            // VIEW 2: DETAILED REPORT FOR SELECTED MOCK TEST
            // ==========================================
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back to List Action */}
              <button 
                onClick={() => {
                  setSelectedMockId(null);
                  setActiveHighlight(null);
                }}
                className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold transition-all text-sm group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> 
                Quay lại danh sách lịch sử Mock
              </button>

              {/* ===== HERO / OVERVIEW SECTION ===== */}
              <section className="mb-8">
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 lg:p-12 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 justify-between">
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
                      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-6">
                        <XCircle className="w-8 h-8" />
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
                        {currentMockDetails?.position}
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium mb-3">
                        {currentMockDetails?.company} • Ngày thực hiện: {currentMockDetails?.date}
                      </p>
                      <p className="text-slate-450 dark:text-slate-400 text-sm max-w-md leading-relaxed mb-6">
                        Bạn cần củng cố thêm một số kiến thức chuyên môn cốt lõi để đạt yêu cầu của vị trí {currentMockDetails?.position}.
                      </p>
                      
                      {/* Actions Block */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20">
                          <RotateCcw className="w-4 h-4" /> Làm lại
                        </button>
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-transparent">
                          <Compass className="w-4 h-4" /> Khám phá thêm
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-12 bg-white dark:bg-[#0B1120] p-6 lg:p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                      <RadialProgress value={currentMockDetails?.score || 0} label="Điểm tổng" size={140} strokeWidth={12} colorClass={(currentMockDetails?.score || 0) < 40 ? "stroke-red-500" : (currentMockDetails?.score || 0) < 60 ? "stroke-amber-500" : "stroke-emerald-500"} />
                      <div className="hidden sm:block w-px h-24 bg-slate-200 dark:bg-slate-800" />
                      <div className="flex gap-6 lg:gap-8">
                        <RadialProgress value={currentMockDetails?.technicalScore || 0} label="Kỹ thuật" size={80} strokeWidth={6} colorClass="stroke-orange-500" />
                        <RadialProgress value={currentMockDetails?.communicationScore || 0} label="Giao tiếp" size={80} strokeWidth={6} colorClass="stroke-blue-500" />
                        <RadialProgress value={currentMockDetails?.problemSolvingScore || 0} label="Vấn đề" size={80} strokeWidth={6} colorClass="stroke-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== EXPERT FEEDBACK ===== */}
              <section className="mb-8">
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Phản hồi từ chuyên gia AI</h2>
                  </div>
                  
                  <p className="text-base leading-loose text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {currentMockDetails?.aiOverallFeedback || "Đang tải phân tích tổng quan từ AI..."}
                  </p>
                </div>
              </section>

              {/* ===== BENTO GRID: STRENGTHS & IMPROVEMENTS ===== */}
              <section className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-emerald-50 dark:bg-[#0B1120] border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" /> Điểm mạnh
                  </h3>
                  <ul className="space-y-4">
                    {currentMockDetails?.strengths && currentMockDetails.strengths.length > 0 ? (
                      currentMockDetails.strengths.map((str: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start text-base text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-1 text-emerald-500" />
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Không có điểm mạnh nổi bật nào được ghi nhận.</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-[#0B1120] border border-amber-100 dark:border-amber-500/20 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <Lightbulb className="w-5 h-5" /> Cần cải thiện
                  </h3>
                  <ul className="space-y-4">
                    {currentMockDetails?.weaknesses && currentMockDetails.weaknesses.length > 0 ? (
                      currentMockDetails.weaknesses.map((weak: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start text-base text-slate-700 dark:text-slate-300">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-1 text-amber-500" />
                          <span>{weak}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Không có điểm yếu nghiêm trọng nào cần khắc phục ngay.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </section>

              {/* ===== DETAILED QUESTIONS (EXPANDABLE) ===== */}
              <section className="mb-8">
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Search className="w-5 h-5 text-slate-400" /> Phản hồi chi tiết từng câu hỏi
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {questions.map(q => {
                      const isExpanded = expandedQ === q.id;
                      return (
                        <div key={q.id} className="border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden transition-all bg-white dark:bg-[#0B1120]">
                          
                          {/* Accordion Header */}
                          <button 
                            onClick={() => {
                              setExpandedQ(isExpanded ? null : q.id);
                              setActiveHighlight(null);
                            }}
                            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">{q.text}</span>
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider rounded-md">
                                {q.tag}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 sm:w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${q.score < 40 ? 'bg-red-500' : q.score < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${q.score}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold w-8 text-right text-slate-500">{q.score}%</span>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {/* Accordion Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]"
                              >
                                {q.questionText ? (
                                  <div className="p-6 sm:p-8 space-y-6">
                                    
                                    {/* Row 1: Split Content Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                      
                                      {/* Left Side: AI Question, Merged Answer/Analysis, and Feedback */}
                                      <div className="lg:col-span-8 space-y-6">
                                        
                                        {/* AI Question */}
                                        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-500/10">
                                          <span className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 block mb-1.5">Câu hỏi từ AI</span>
                                          <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                            {q.questionText}
                                          </p>
                                        </div>

                                        {/* Merged Answer & Analysis */}
                                        <div className="p-5 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                                          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                                            <AlertTriangle className="w-4 h-4" /> PHÂN TÍCH CÂU TRẢ LỜI (NHẤN VÀO PHẦN ĐƯỢC ĐÁNH DẤU ĐỂ XEM CHI TIẾT)
                                          </span>
                                          <p className="text-base sm:text-lg leading-loose text-slate-700 dark:text-slate-300">
                                            {(() => {
                                              const hasChunks = q.analysisChunks && q.analysisChunks.length > 0;
                                              const joined = hasChunks ? q.analysisChunks.map((c: any) => c.text).join('').toLowerCase() : '';
                                              const ans = (q.userAnswer || '').toLowerCase();
                                              const isVerbatim = hasChunks && (joined.includes(ans) || ans.includes(joined));

                                              if (!isVerbatim) {
                                                const score = q.score ?? 0;
                                                const type = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
                                                
                                                return (
                                                  <span 
                                                    className={`relative group ${getHighlightStyle(type)}`}
                                                    onClick={(e) => handleHighlightClick({
                                                      text: q.userAnswer || "Ứng viên không trả lời câu hỏi này.",
                                                      type: type,
                                                      popupTitle: type === 'success' ? "Khá tốt" : type === 'warning' ? "Đạt yêu cầu" : "Cần cải thiện",
                                                      popupDesc: q.feedbackChunks && q.feedbackChunks.length > 0 ? q.feedbackChunks.map((c: any) => c.text).join(' ') : "AI đánh giá câu trả lời của bạn có những điểm cần hoàn thiện.",
                                                      statusText: type === 'success' ? "Đạt điểm tốt" : type === 'warning' ? "Đạt điểm trung bình" : "Cần nỗ lực thêm"
                                                    }, e)}
                                                  >
                                                    {q.userAnswer || "Ứng viên không trả lời câu hỏi này."}
                                                    
                                                    {/* LEGACY IMMEDIATE HOVER TOOLTIP */}
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[320px] p-4 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl hidden group-hover:block z-45 pointer-events-none text-left select-none leading-relaxed transition-all">
                                                      <span className={`block font-extrabold uppercase tracking-widest text-[11px] sm:text-xs mb-1.5 flex items-center gap-1.5 ${getPopupColor(type).header}`}>
                                                        {type === 'danger' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                        {type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                                        {type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                                        {type === 'success' ? "Đánh giá tốt" : type === 'warning' ? "Đánh giá trung bình" : "Cần bổ sung kiến thức"}
                                                      </span>

                                                      <span className="block p-2 rounded bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 mb-2">
                                                        <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Câu trả lời</span>
                                                        <span className="block text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 font-semibold italic leading-normal">
                                                          "{q.userAnswer || "Ứng viên không trả lời câu hỏi này."}"
                                                        </span>
                                                      </span>

                                                      <span className="block mb-2.5">
                                                        <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Chi tiết nhận xét</span>
                                                        <span className="block text-[11px] sm:text-xs text-slate-650 dark:text-slate-300 font-medium leading-normal">
                                                          {q.feedbackChunks && q.feedbackChunks.length > 0 ? q.feedbackChunks.map((c: any) => c.text).join(' ') : "AI nhận xét bạn trả lời đúng trọng tâm nhưng cần mở rộng chi tiết cụ thể."}
                                                        </span>
                                                      </span>

                                                      <span className={`block p-2.5 rounded-lg border text-[11px] sm:text-xs font-bold leading-normal ${getPopupColor(type).bg} ${getPopupColor(type).border} ${getPopupColor(type).header}`}>
                                                        <span className="block text-[8px] uppercase font-bold tracking-wider opacity-85 mb-0.5">Lời khuyên</span>
                                                        {type === 'success' ? "Nắm vững lý thuyết cốt lõi!" : type === 'warning' ? "Nên học thêm tài liệu bổ sung" : "Xem lại tài liệu cấu hình Spring Boot"}
                                                      </span>

                                                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-200 dark:border-t-white/10" />
                                                      <span className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white dark:border-t-[#0B1120]" />
                                                    </span>
                                                  </span>
                                                );
                                              }

                                              return q.analysisChunks.map((chunk, idx) => (
                                              <span 
                                                key={idx} 
                                                className={`relative group ${getHighlightStyle(chunk.type)}`}
                                                onClick={(e) => handleHighlightClick(chunk, e)}
                                              >
                                                {chunk.text}
                                                
                                                {/* IMMEDIATE HOVER TOOLTIP */}
                                                {chunk.type !== 'normal' && (
                                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[320px] p-4 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl hidden group-hover:block z-45 pointer-events-none text-left select-none leading-relaxed transition-all">
                                                    
                                                    <span className={`block font-extrabold uppercase tracking-widest text-[11px] sm:text-xs mb-1.5 flex items-center gap-1.5 ${getPopupColor(chunk.type).header}`}>
                                                      {chunk.type === 'danger' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.popupTitle}
                                                    </span>

                                                    <span className="block p-2 rounded bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 mb-2">
                                                      <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Cụm từ được đánh giá</span>
                                                      <span className="block text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 font-semibold italic leading-normal">
                                                        "{chunk.text}"
                                                      </span>
                                                    </span>

                                                    {chunk.popupDesc && (
                                                      <span className="block mb-2.5">
                                                        <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Chi tiết nhận xét</span>
                                                        <span className="block text-[11px] sm:text-xs text-slate-650 dark:text-slate-300 font-medium leading-normal">
                                                          {chunk.popupDesc}
                                                        </span>
                                                      </span>
                                                    )}

                                                    {chunk.statusText && (
                                                      <span className={`block p-2.5 rounded-lg border text-[11px] sm:text-xs font-bold leading-normal ${getPopupColor(chunk.type).bg} ${getPopupColor(chunk.type).border} ${getPopupColor(chunk.type).header}`}>
                                                        <span className="block text-[8px] uppercase font-bold tracking-wider opacity-85 mb-0.5">Gợi ý cải thiện</span>
                                                        {chunk.statusText}
                                                      </span>
                                                    )}

                                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-200 dark:border-t-white/10" />
                                                    <span className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white dark:border-t-[#0B1120]" />
                                                  </span>
                                                )}
                                              </span>
                                            ))
                                            })()}
                                          </p>
                                        </div>

                                        {/* Detailed AI Feedback */}
                                        <div className="pt-4 border-t border-slate-200/50 dark:border-white/5">
                                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">Phản hồi chi tiết từ chuyên gia AI</span>
                                          <p className="text-base sm:text-lg leading-loose text-slate-600 dark:text-slate-300">
                                            {q.feedbackChunks?.map((chunk, idx) => (
                                              <span 
                                                key={idx} 
                                                className={`relative group ${getHighlightStyle(chunk.type)}`}
                                                onClick={(e) => handleHighlightClick(chunk, e)}
                                              >
                                                {chunk.text}
                                                
                                                {/* IMMEDIATE HOVER TOOLTIP */}
                                                {chunk.type !== 'normal' && (
                                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[320px] p-4 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl hidden group-hover:block z-45 pointer-events-none text-left select-none leading-relaxed transition-all">
                                                    
                                                    <span className={`block font-extrabold uppercase tracking-widest text-[11px] sm:text-xs mb-1.5 flex items-center gap-1.5 ${getPopupColor(chunk.type).header}`}>
                                                      {chunk.type === 'danger' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                                      {chunk.popupTitle}
                                                    </span>

                                                    <span className="block p-2 rounded bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 mb-2">
                                                      <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Cụm từ được đánh giá</span>
                                                      <span className="block text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 font-semibold italic leading-normal">
                                                        "{chunk.text}"
                                                      </span>
                                                    </span>

                                                    {chunk.popupDesc && (
                                                      <span className="block mb-2.5">
                                                        <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-400 mb-0.5">Chi tiết nhận xét</span>
                                                        <span className="block text-[11px] sm:text-xs text-slate-650 dark:text-slate-300 font-medium leading-normal">
                                                          {chunk.popupDesc}
                                                        </span>
                                                      </span>
                                                    )}

                                                    {chunk.statusText && (
                                                      <span className={`block p-2.5 rounded-lg border text-[11px] sm:text-xs font-bold leading-normal ${getPopupColor(chunk.type).bg} ${getPopupColor(chunk.type).border} ${getPopupColor(chunk.type).header}`}>
                                                        <span className="block text-[8px] uppercase font-bold tracking-wider opacity-85 mb-0.5">Gợi ý cải thiện</span>
                                                        {chunk.statusText}
                                                      </span>
                                                    )}

                                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-200 dark:border-t-white/10" />
                                                    <span className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white dark:border-t-[#0B1120]" />
                                                  </span>
                                                )}
                                              </span>
                                            ))}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Right Side: Scoring & Strengths/Weaknesses */}
                                      <div className="lg:col-span-4 flex flex-col justify-start space-y-6">
                                        <div className="p-6 bg-white dark:bg-[#0B1120] border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                                          <RadialProgress value={q.score} label="Điểm câu hỏi" size={120} strokeWidth={8} colorClass={q.score < 40 ? "stroke-red-500" : q.score < 60 ? "stroke-amber-500" : "stroke-emerald-500"} />
                                        </div>

                                        <div className="space-y-4 flex-1">
                                          {q.strengths && q.strengths.length > 0 && (
                                            <div className="p-5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl shadow-sm">
                                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-2.5">Ưu điểm</span>
                                              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                {q.strengths.map((str, idx) => (
                                                  <li key={idx} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{str}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {q.weaknesses && q.weaknesses.length > 0 && (
                                            <div className="p-5 bg-rose-500/[0.02] border border-rose-500/10 rounded-2xl shadow-sm">
                                              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-2.5">Điểm còn thiếu</span>
                                              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                {q.weaknesses.map((weak, idx) => (
                                                  <li key={idx} className="flex items-start gap-2">
                                                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                                    <span>{weak}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Row 2: Full Width Recommendations */}
                                    {q.recommendations && q.recommendations.length > 0 && (
                                      <div className="pt-6 border-t border-slate-200/50 dark:border-white/5 w-full">
                                        <div className="p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/15 w-full shadow-sm">
                                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-3">
                                            <Lightbulb className="w-4 h-4" /> Đề xuất từ AI
                                          </span>
                                          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {q.recommendations.map((rec, idx) => (
                                              <li key={idx} className="flex items-start gap-3 bg-white/50 dark:bg-[#0B1120]/40 p-4 rounded-xl border border-slate-100 dark:border-white/[0.02] shadow-sm">
                                                <span className="text-blue-500 font-extrabold text-base leading-none">•</span>
                                                <span>{rec}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    Chi tiết câu hỏi này đang được phân tích bởi AI...
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ===== UNLOCKED PREMIUM LEARNING MATERIALS ===== */}
              <section className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Card 1 */}
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden relative group">
                  <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" /> Chủ đề nên học
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-3.5">
                      {currentMockDetails?.topicsToLearn && currentMockDetails.topicsToLearn.length > 0 ? (
                        currentMockDetails.topicsToLearn.map((topic: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Không có chủ đề đề xuất thêm.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden relative group">
                  <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-emerald-500" /> Tài liệu gợi ý
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-3.5">
                      {currentMockDetails?.resources && currentMockDetails.resources.length > 0 ? (
                        currentMockDetails.resources.map((res: string, idx: number) => (
                          <li key={idx} className="flex items-center justify-between text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-blue-500 cursor-pointer group/link">
                            <span className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-slate-400 group-hover/link:text-blue-500" />
                              <span>{res}</span>
                            </span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all" />
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Không có tài liệu tham khảo nào được đề xuất.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Footer />
    </main>
  );
}
