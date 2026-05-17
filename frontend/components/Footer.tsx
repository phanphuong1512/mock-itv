import Link from 'next/link';
import { Sparkles, Globe, Users, Code2, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="pt-20 pb-10 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5 mt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        {/* Logo & Description */}
        <div className="lg:col-span-4">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight mb-6">
            <span className="text-blue-500">Mock</span>
            <span className="text-emerald-500 relative">
              ITV
              <Sparkles className="absolute -top-3 -right-3 w-4 h-4 text-emerald-400" />
            </span>
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium italic">
            "© 2026 MockITV by PhuongPV"
          </p>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10 transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10 transition-colors">
              <Users className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10 transition-colors">
              <Code2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Links Columns */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-5">Hồ sơ</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <li><Link href="/jobs" className="hover:text-slate-900 dark:hover:text-white transition-colors">Mock tuyển dụng</Link></li>
              <li><Link href="/history" className="hover:text-slate-900 dark:hover:text-white transition-colors">Lịch sử mock</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Bảng giá</Link></li>
            </ul>
          </div>
          
          {/* Col 2 */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-5">Hỗ trợ</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <li><Link href="#" className="hover:text-white transition-colors">Trung tâm hỗ trợ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQ)</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-5">Pháp lý</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <li><Link href="#" className="hover:text-white transition-colors">Quyền riêng tư</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-5">Cộng đồng</h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li>
                <Link href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  Câu chuyện thành công
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
