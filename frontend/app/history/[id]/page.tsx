'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ArrowRight, Search, RotateCcw, Compass, BookOpen, Lightbulb, 
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, ExternalLink, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MockSessionResponse, SessionQuestionResponse, HighlightChunk } from '@/types/api';

function RadialProgress({ value, label, size = 100, strokeWidth = 8, colorClass = "stroke-blue-500" }: { value: number, label: string, size?: number, strokeWidth?: number, colorClass?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            className={colorClass}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black">{value}<span className="text-sm font-semibold opacity-60">%</span></span>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// HighlightItem is now HighlightChunk from api.ts
// Remove duplicate definition here


export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = parseInt(resolvedParams.id);

  const [sessionDetail, setSessionDetail] = useState<MockSessionResponse | null>(null);
  const [questions, setQuestions] = useState<SessionQuestionResponse[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightChunk | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
    fetch('/api/sessions/' + sessionId, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải bài mock hoặc không có quyền truy cập');
        return res.json();
      })
      .then((data: MockSessionResponse) => {
        setSessionDetail(data);
        if (data.questions) {
          setQuestions(data.questions);
        }
      })
      .catch(err => console.error(err));
  }, [sessionId]);


  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setActiveHighlight(null);
    }
  };

  const handleHighlightClick = (item: HighlightChunk, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'normal') return;
    setActiveHighlight(item);
  };

  const getHighlightStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100/70 hover:bg-emerald-200/80 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/35 text-emerald-800 dark:text-emerald-300 border-b-2 border-emerald-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      case 'warning': return 'bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-500/20 dark:hover:bg-amber-500/35 text-amber-800 dark:text-amber-300 border-b-2 border-amber-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      case 'danger': return 'bg-rose-100/70 hover:bg-rose-200/80 dark:bg-rose-500/20 dark:hover:bg-rose-500/35 text-rose-800 dark:text-rose-300 border-b-2 border-rose-500 cursor-pointer px-1 py-0.5 rounded transition-all';
      default: return '';
    }
  };

  const getPopupColor = (type: string) => {
    switch (type) {
      case 'success': return { border: 'border-emerald-500/30', header: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'warning': return { border: 'border-amber-500/30', header: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'danger': return { border: 'border-rose-500/30', header: 'text-rose-500', bg: 'bg-rose-500/10' };
      default: return { border: 'border-white/10', header: 'text-white', bg: 'bg-slate-900/10' };
    }
  };

  if (!sessionDetail) return <div className="min-h-screen bg-background pt-24 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />
      
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
        <motion.div
          key="detail-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          <button 
            onClick={() => router.push('/history')}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold transition-all text-sm group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> 
            Quay lại danh sách lịch sử Mock
          </button>

          <section className="mb-8">
            <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 lg:p-12 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 justify-between">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-6">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
                    {sessionDetail.position}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium mb-3">
                    {sessionDetail.company} • Ngày thực hiện: {sessionDetail.date}
                  </p>
                  <p className="text-slate-450 dark:text-slate-400 text-sm max-w-md leading-relaxed mb-6">
                    Bạn cần củng cố thêm một số kiến thức chuyên môn cốt lõi để đạt yêu cầu của vị trí {sessionDetail.position}.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button onClick={() => router.push('/mocks')} className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20">
                      <RotateCcw className="w-4 h-4" /> Làm lại
                    </button>
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-transparent">
                      <Compass className="w-4 h-4" /> Khám phá thêm
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-12 bg-white dark:bg-[#0B1120] p-6 lg:p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                  <RadialProgress value={sessionDetail.score} label="Điểm tổng" size={140} strokeWidth={12} colorClass={sessionDetail.score < 40 ? "stroke-red-500" : sessionDetail.score < 60 ? "stroke-amber-500" : "stroke-emerald-500"} />
                  <div className="hidden sm:block w-px h-24 bg-slate-200 dark:bg-slate-800" />
                  <div className="flex gap-6 lg:gap-8">
                    <RadialProgress value={sessionDetail.technicalScore} label="Kỹ thuật" size={80} strokeWidth={6} colorClass="stroke-orange-500" />
                    <RadialProgress value={sessionDetail.communicationScore} label="Giao tiếp" size={80} strokeWidth={6} colorClass="stroke-blue-500" />
                    <RadialProgress value={sessionDetail.problemSolvingScore} label="Vấn đề" size={80} strokeWidth={6} colorClass="stroke-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Phản hồi từ chuyên gia AI</h2>
              </div>
              <p className="text-base leading-loose text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {sessionDetail.aiOverallFeedback}
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-emerald-50 dark:bg-[#0B1120] border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" /> Điểm mạnh
              </h3>
              <ul className="space-y-4">
                {sessionDetail.strengths.length > 0 ? (
                  sessionDetail.strengths.map((str: string, idx: number) => (
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
                {sessionDetail.weaknesses.length > 0 ? (
                  sessionDetail.weaknesses.map((weak: string, idx: number) => (
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

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]"
                          >
                            <div className="p-6 sm:p-8 space-y-6">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-6">
                                  <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-500/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 block mb-1.5">Câu hỏi từ AI</span>
                                    <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                      {q.questionText}
                                    </p>
                                  </div>

                                  <div className="p-5 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                                      <AlertTriangle className="w-4 h-4" /> PHÂN TÍCH CÂU TRẢ LỜI (NHẤN VÀO PHẦN ĐƯỢC ĐÁNH DẤU ĐỂ XEM CHI TIẾT)
                                    </span>
                                    <p className="text-base sm:text-lg leading-loose text-slate-700 dark:text-slate-300">
                                      {(() => {
                                        const hasChunks = q.analysisChunks && q.analysisChunks.length > 0;
                                        
                                        if (hasChunks) {
                                          return (q.analysisChunks || []).map((chunk: any, idx: number) => (
                                            <span 
                                              key={idx} 
                                              className={`relative group ${getHighlightStyle(chunk.type)}`}
                                              onClick={(e) => handleHighlightClick(chunk, e)}
                                            >
                                              {chunk.text}
                                            </span>
                                          ));
                                        }

                                        // Fallback if no chunks
                                        const score = q.score ?? 0;
                                        const type = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
                                        return (
                                          <span 
                                            className={`relative group ${getHighlightStyle(type)}`}
                                            onClick={(e) => handleHighlightClick({
                                              id: 'fallback-verbatim',
                                              text: q.userAnswer || "Ứng viên không trả lời câu hỏi này.",
                                              type: type as any,
                                              popupTitle: type === 'success' ? "Khá tốt" : type === 'warning' ? "Đạt yêu cầu" : "Cần cải thiện",
                                              popupDesc: q.feedbackChunks && q.feedbackChunks.length > 0 ? q.feedbackChunks.map((c: any) => c.text).join(' ') : "AI đánh giá câu trả lời của bạn có những điểm cần hoàn thiện.",
                                              statusText: type === 'success' ? "Đạt điểm tốt" : type === 'warning' ? "Đạt điểm trung bình" : "Cần nỗ lực thêm"
                                            }, e)}
                                          >
                                            {q.userAnswer || "Ứng viên không trả lời câu hỏi này."}
                                          </span>
                                        );
                                      })()}
                                    </p>
                                  </div>

                                  <div className="pt-4 border-t border-slate-200/50 dark:border-white/5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">Phản hồi chi tiết từ chuyên gia AI</span>
                                    <p className="text-base sm:text-lg leading-loose text-slate-600 dark:text-slate-300">
                                      {q.feedbackChunks?.map((chunk: any, idx: number) => (
                                        <span 
                                          key={idx} 
                                          className={`relative group ${getHighlightStyle(chunk.type)}`}
                                          onClick={(e) => handleHighlightClick(chunk, e)}
                                        >
                                          {chunk.text}
                                        </span>
                                      ))}
                                    </p>
                                  </div>
                                </div>

                                <div className="lg:col-span-4 flex flex-col justify-start space-y-6">
                                  <div className="p-6 bg-white dark:bg-[#0B1120] border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                                    <RadialProgress value={q.score} label="Điểm câu hỏi" size={120} strokeWidth={8} colorClass={q.score < 40 ? "stroke-red-500" : q.score < 60 ? "stroke-amber-500" : "stroke-emerald-500"} />
                                  </div>

                                  <div className="space-y-4 flex-1">
                                    {q.strengths && q.strengths.length > 0 && (
                                      <div className="p-5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl shadow-sm">
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-2.5">Ưu điểm</span>
                                        <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                          {q.strengths.map((str: string, idx: number) => (
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
                                          {q.weaknesses.map((weak: string, idx: number) => (
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

                              {q.recommendations && q.recommendations.length > 0 && (
                                <div className="pt-6 border-t border-slate-200/50 dark:border-white/5 w-full">
                                  <div className="p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/15 w-full shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-3">
                                      <Lightbulb className="w-4 h-4" /> Đề xuất từ AI
                                    </span>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                      {q.recommendations.map((rec: string, idx: number) => (
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden relative group">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Chủ đề nên học
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5">
                  {sessionDetail.topicsToLearn.length > 0 ? (
                    sessionDetail.topicsToLearn.map((topic: string, idx: number) => {
                      const url = topic.startsWith('http://') || topic.startsWith('https://')
                        ? topic
                        : `https://www.google.com/search?q=${encodeURIComponent(topic)}`;
                      return (
                        <li key={idx}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer group/link p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                          >
                            <span className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                              <span>{topic}</span>
                            </span>
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all text-blue-500 shrink-0" />
                          </a>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-slate-500 dark:text-slate-400 italic flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Không có chủ đề đề xuất thêm.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden relative group">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-emerald-500" /> Tài liệu gợi ý
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5">
                  {sessionDetail.resources.length > 0 ? (
                    sessionDetail.resources.map((res: any, idx: number) => {
                      let title = '';
                      let url = '';

                      if (typeof res === 'object' && res !== null) {
                        title = res.title || res.name || 'Tài liệu hướng dẫn';
                        url = res.url || '';
                      } else if (typeof res === 'string') {
                        if (res.includes('|')) {
                          const parts = res.split('|');
                          title = parts[0].trim();
                          url = parts.slice(1).join('|').trim();
                        } else {
                          title = res.trim();
                          url = (res.startsWith('http://') || res.startsWith('https://')) ? res.trim() : '';
                        }
                      }

                      const finalUrl = url || (title.startsWith('http') ? title : `https://www.google.com/search?q=${encodeURIComponent(title)}`);

                      return (
                        <li key={idx}>
                          <a
                            href={finalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer group/link p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                          >
                            <span className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{title}</span>
                            </span>
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all text-emerald-500 shrink-0" />
                          </a>
                        </li>
                      );
                    })
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
      </div>

      <Footer />
    </main>
  );
}
