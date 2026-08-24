'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Calendar, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MockSessionResponse } from '@/types/api';

export default function HistoryPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<Partial<MockSessionResponse>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const completedMocks = data
            .filter((session: MockSessionResponse) => session.status === 'completed')
            .map((session: MockSessionResponse) => ({
              id: session.id,
              position: session.position || 'Custom Mock',
              company: session.company || 'System',
              department: session.department || 'General',
              level: session.level || 'All Levels',
              date: session.date || 'N/A',
              score: session.score || 0,
              questionsCount: session.questionsCount || 7,
              techStack: session.techStack || []
            }));
          setMocks(completedMocks);
        }
      })
      .catch(err => console.error("Failed to fetch sessions history", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />

      <div className="pt-24 pb-16 flex-1 w-full max-w-6xl mx-auto px-6 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Lịch sử Mock của tôi</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                  Theo dõi, ôn tập và xem lại kết quả phỏng vấn giả lập của bạn với PhuongPV AI.
                </p>
              </div>

              <div className="flex items-center gap-5 bg-card-bg border border-slate-200 dark:border-white/5 px-6 py-3.5 rounded-2xl shadow-sm self-start md:self-auto shrink-0">
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đã luyện tập</span>
                  <span className="text-xl font-black text-blue-500">{mocks.length} bài Mock</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đạt yêu cầu</span>
                  <span className="text-xl font-black text-emerald-500">
                    {mocks.filter(m => (m.score || 0) >= 50).length} / {mocks.length}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Sessions in Rows */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-card-bg border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : mocks.length === 0 ? (
              <div className="text-center py-20 bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Chưa có bài phỏng vấn nào</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Bạn chưa hoàn thành bài mock interview nào. Hãy chọn một vị trí mong muốn để bắt đầu luyện tập ngay hôm nay!
                </p>
                <button
                  onClick={() => router.push('/mocks')}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition-colors cursor-pointer text-sm shadow-lg shadow-blue-500/20"
                >
                  Khám phá các vị trí Mock
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mocks.map((mock) => {
                  const score = mock.score || 0;
                  const isPassed = score >= 50;

                  return (
                    <motion.div
                      key={mock.id}
                      whileHover={{ x: 4 }}
                      onClick={() => router.push(`/history/${mock.id}`)}
                      className="group relative bg-card-bg border border-slate-200 dark:border-white/5 hover:border-blue-500/40 dark:hover:border-blue-500/35 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Position & Company & Badges */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {mock.date}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                            {mock.department}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                            {mock.level}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-base sm:text-lg font-black group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors truncate">
                            {mock.position}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            • {mock.company}
                          </span>
                        </div>

                        {/* Tech Stack Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {mock.techStack?.map((tech: string, idx: number) => (
                            <span 
                              key={idx} 
                              className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-350 text-[10px] font-semibold rounded-md border border-slate-200/60 dark:border-transparent"
                            >
                              {tech}
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-400 ml-1 font-medium">
                            ({mock.questionsCount} câu hỏi)
                          </span>
                        </div>
                      </div>

                      {/* Right: Score & Status & Arrow */}
                      <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                        <div className="text-left md:text-right">
                          <div className="flex items-center gap-1.5 justify-start md:justify-end">
                            <div className={`w-2 h-2 rounded-full ${score < 40 ? 'bg-red-500' : score < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className="text-sm sm:text-base font-black text-foreground">
                              {score}%
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isPassed ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {isPassed ? 'Đạt yêu cầu' : 'Cần cải thiện'}
                          </span>
                        </div>

                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center text-slate-400 shrink-0">
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}

