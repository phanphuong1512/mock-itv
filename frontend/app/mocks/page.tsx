'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import {
  Info, Server, Monitor, Layers, Smartphone, Infinity as InfinityIcon,
  Database, LineChart, Brain, Shield, CheckCircle, Cpu, Link as LinkIcon,
  Gamepad2, Building2, Clock, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { JobResponse } from '@/types/api';

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

export default function MocksPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('Tất cả');
  const [jobs, setJobs] = useState<JobResponse[]>([]);

  // Fetch jobs from backend API
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data.map((j: JobResponse) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            category: j.category,
            level: j.level,
            techStack: j.techStack || [],
            rounds: j.rounds,
            logo: j.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${j.company}&backgroundColor=0B1120`,
            department: j.department || j.category
          })));
        }
      })
      .catch((err) => {
        console.error("Backend error or connection failed:", err);
      });
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (job.id === 999 || job.category === 'custom' || job.title?.toLowerCase().includes('custom') || job.title?.toLowerCase().includes('tùy chỉnh')) return false;
    const matchCategory = activeCategory === 'all' || job.category === activeCategory;
    const matchLevel = activeLevel === 'Tất cả' || job.level === activeLevel;
    return matchCategory && matchLevel;
  });


  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-8 flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
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
                      onClick={() => router.push(`/mocks/${job.id}`)}
                      className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[240px] group hover:border-blue-500/50 hover:shadow-xl transition-all shadow-sm overflow-hidden cursor-pointer"
                    >
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
                      
                      <div className="flex-1 overflow-hidden flex flex-col justify-center">
                        <h3 className="text-base font-black mb-1 leading-normal group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2 py-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-450 font-medium mb-3 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{job.company}</span>
                        </p>

                        <div className="flex flex-wrap gap-1.5 overflow-hidden">
                          {job.techStack.map((tech: string) => (
                            <span key={tech} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {job.rounds} câu hỏi
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
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
}
