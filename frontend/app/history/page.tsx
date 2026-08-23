'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ArrowRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MockSessionResponse } from '@/types/api';

export default function HistoryPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<Partial<MockSessionResponse>[]>([]);

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
      .catch(err => console.error("Failed to fetch sessions history", err));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />

      <div className="pt-24 pb-12 flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-8">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Lịch sử Mock của tôi</h1>
                <p className="text-slate-500 dark:text-slate-450 text-base">
                  Theo dõi, ôn tập và xem lại kết quả phỏng vấn giả lập của bạn với PhuongPV AI.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-card-bg border border-slate-200 dark:border-white/5 px-6 py-3.5 rounded-2xl shadow-sm self-center md:self-auto">
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đã luyện tập</span>
                  <span className="text-xl font-black text-blue-500">{mocks.length} bài Mock</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đạt yêu cầu</span>
                  <span className="text-xl font-black text-emerald-500">{mocks.filter(m => (m.score || 0) >= 50).length} / {mocks.length}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mocks.map((mock) => (
                <motion.div
                  key={mock.id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => router.push(`/history/${mock.id}`)}
                  className="relative bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-blue-500/35 dark:hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[250px] overflow-hidden"
                >
                  <div>
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
                    
                    <h3 className="text-lg font-black group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {mock.position}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mb-4">{mock.company}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mock.techStack?.map((tech: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-350 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-transparent">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">
                        {mock.questionsCount} câu hỏi
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${(mock.score || 0) < 40 ? 'bg-red-500' : (mock.score || 0) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-slate-500">
                          Điểm: {mock.score || 0}%
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
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
