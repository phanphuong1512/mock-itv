'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Check, 
  X, 
  Rocket, 
  Zap, 
  UserCircle2, 
  ShieldCheck, 
  CreditCard, 
  QrCode,
  ChevronDown,
  Lock,
  MessageCircle,
  FileText,
  Repeat,
  GitCommit,
  Code2,
  Mic,
  Users,
  FastForward,
  Banknote,
  Copy,
  CheckCheck,
  Loader2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';

interface PaymentInfo {
  order: {
    orderCode: string;
    amount: number;
    plan: string;
  };
  qrUrl: string;
  bankInfo: {
    bankName: string;
    accountNo: string;
    accountName: string;
    amount: number;
    orderCode: string;
    planName: string;
  };
}

export default function PricingPage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Clear polling on unmount
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

  const handleSelectPlan = async (planKey: 'pro' | 'premium') => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoadingPlan(planKey);
      const token = localStorage.getItem('mockitv_token');
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

      const data: PaymentInfo = await res.json();
      setPaymentInfo(data);
      setPaymentStatus('pending');

      // Start real-time polling to check if SePay verified payment
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payments/order-status/${data.order.orderCode}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'completed') {
              setPaymentStatus('completed');
              clearInterval(pollIntervalRef.current);
              await refreshUser();
            }
          }
        } catch (e) {
          console.error('Error polling payment status', e);
        }
      }, 2000);
    } catch (err: any) {
      alert(`⚠️ Lỗi khởi tạo thanh toán:\n${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const closePaymentModal = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPaymentInfo(null);
    setPaymentStatus('pending');
  };

  const isCurrentPlan = (plan: string) => {
    if (!user) return plan === 'free';
    return (user.plan || 'free').toLowerCase() === plan.toLowerCase();
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30">
      <Navbar />
      
      {/* ===== HERO SECTION ===== */}
      <section className="pt-28 pb-8 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-500/20 via-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-350 text-xs sm:text-sm font-black mb-4 animate-pulse shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>🔥 SIÊU ƯU ĐÃI GIẢM 80% (ÁP DỤNG DUY NHẤT CHO 20 TÀI KHOẢN ĐẦU TIÊN)</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
          {t('pricing.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </section>

      {/* ===== PRICING CARDS ===== */}
      <section className="px-6 lg:px-12 max-w-5xl mx-auto mb-16">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Card 1 - Miễn phí */}
          <div className="bg-card-bg rounded-[2rem] p-6 border border-foreground/10 flex flex-col h-full relative group">
            <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-foreground/60" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{t('pricing.free')}</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-extrabold">0đ</span>
            </div>
            <p className="text-sm text-foreground/60 mb-6 pb-6 border-b border-foreground/10">4 lượt luyện tập / tháng</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="4 Lượt phỏng vấn AI" included={true} />
              <FeatureItem text="Sàng lọc & Phân tích CV" included={true} />
              <FeatureItem text="Chấm điểm đa chiều" included={true} />
              <FeatureItem text="Lịch sử phỏng vấn" included={true} />
              <FeatureItem text="Phỏng vấn giọng nói (Tặng 1 lần/24h)" included={true} />
              <FeatureItem text="Custom Mock theo JD/CV riêng" included={false} />
              <FeatureItem text="Ưu tiên hàng đợi AI" included={false} />
            </ul>
            
            <button 
              disabled={true}
              className="w-full py-3.5 bg-foreground/10 text-foreground/50 font-bold rounded-full cursor-not-allowed"
            >
              {isCurrentPlan('free') ? 'Gói hiện tại của bạn' : 'Mặc định'}
            </button>
          </div>

          {/* Card 2 - Pro (Highlighted with 80% Sale) */}
          <div className="bg-card-bg rounded-[2rem] p-6 border-2 border-blue-500 relative flex flex-col h-full shadow-[0_0_40px_rgba(37,99,235,0.2)] transform lg:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-red-500 to-amber-500 text-white text-[10px] font-black rounded-full tracking-wider uppercase shadow-md flex items-center gap-1">
              🔥 GIẢM 80% • CHỈ 20 SUẤT ĐẦU
            </div>
            
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Pro</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-blue-500">19k</span>
              <span className="text-base text-foreground/40 line-through font-semibold">99k</span>
              <span className="text-sm text-foreground/60 font-medium">/tháng</span>
            </div>
            <p className="text-sm text-foreground/60 mb-6 pb-6 border-b border-foreground/10 font-medium">30 lượt luyện tập / tháng (Tiết kiệm 80%)</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="30 Phỏng vấn AI chuẩn quốc tế" included={true} blueIcon={true} />
              <FeatureItem text="Phỏng vấn bằng Giọng nói (Voice AI)" included={true} blueIcon={true} />
              <FeatureItem text="Custom Mock theo CV & JD riêng" included={true} blueIcon={true} />
              <FeatureItem text="Chấm điểm chuyên môn & soft skills" included={true} blueIcon={true} />
              <FeatureItem text="Gợi ý cải thiện từng câu trả lời" included={true} blueIcon={true} />
              <FeatureItem text="Ưu tiên hàng đợi AI không giới hạn" included={true} blueIcon={true} />
            </ul>
            
            <button 
              onClick={() => handleSelectPlan('pro')}
              disabled={loadingPlan === 'pro' || isCurrentPlan('pro')}
              className={`w-full py-3.5 font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isCurrentPlan('pro')
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              }`}
            >
              {loadingPlan === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCurrentPlan('pro') ? (
                <span>Đang sử dụng gói Pro</span>
              ) : (
                <span>Nâng cấp lên Pro (19.000đ)</span>
              )}
            </button>
          </div>

          {/* Card 3 - Premium VIP (With 80% Sale) */}
          <div className="bg-card-bg rounded-[2rem] p-6 border border-amber-500/40 relative flex flex-col h-full">
            <div className="absolute -top-3.5 right-6 px-3 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-350 text-[10px] font-black rounded-full uppercase tracking-wider">
              🔥 TIẾT KIỆM 80%
            </div>

            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
              <UserCircle2 className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold mb-1">Premium VIP</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-amber-500">39k</span>
              <span className="text-base text-foreground/40 line-through font-semibold">199k</span>
              <span className="text-sm text-foreground/60 font-medium">/tháng</span>
            </div>
            <p className="text-sm text-foreground/60 mb-6 pb-6 border-b border-foreground/10 font-medium">100 lượt luyện tập (Tiết kiệm 80%)</p>
            
            <ul className="space-y-3 mb-6 flex-1">
              <FeatureItem text="100 Lượt phỏng vấn toàn diện" included={true} blueIcon={true} />
              <FeatureItem text="Full quyền Voice AI không giới hạn" included={true} blueIcon={true} />
              <FeatureItem text="Custom Mock RAG từ mọi CV/JD" included={true} blueIcon={true} />
              <FeatureItem text="Báo cáo phân tích chuyên sâu chi tiết" included={true} blueIcon={true} />
              <FeatureItem text="Ưu tiên hàng đợi tối đa 24/7" included={true} blueIcon={true} />
              <FeatureItem text="Hỗ trợ 1-1 từ đội ngũ kỹ sư" included={true} blueIcon={true} />
            </ul>
            
            <button 
              onClick={() => handleSelectPlan('premium')}
              disabled={loadingPlan === 'premium' || isCurrentPlan('premium')}
              className={`w-full py-3.5 font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isCurrentPlan('premium')
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
              }`}
            >
              {loadingPlan === 'premium' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCurrentPlan('premium') ? (
                <span>Đang sử dụng gói Premium</span>
              ) : (
                <span>Nâng cấp Premium (39.000đ)</span>
              )}
            </button>
          </div>


        </div>
      </section>


      {/* ===== SEPAY VIETQR PAYMENT MODAL ===== */}
      <AnimatePresence>
        {paymentInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-card-bg border border-foreground/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={closePaymentModal}
                className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {paymentStatus === 'completed' ? (
                /* Success State */
                <div className="py-8 text-center space-y-5">
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                    <CheckCheck className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-foreground mb-1">
                      Thanh toán thành công! 🎉
                    </h3>
                    <p className="text-sm text-foreground/70">
                      Gói <strong className="text-blue-500 font-bold">{paymentInfo.bankInfo.planName}</strong> của bạn đã được kích hoạt thành công.
                    </p>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Bắt đầu luyện tập ngay
                  </button>
                </div>
              ) : (
                /* Payment Pending State */
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

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner mb-6">
                    <img
                      src={paymentInfo.qrUrl}
                      alt="VietQR Payment"
                      className="w-52 h-52 object-contain"
                    />
                    <span className="text-[11px] font-semibold text-slate-500 mt-1">
                      Mở app ngân hàng bất kỳ để quét mã VietQR
                    </span>
                  </div>

                  {/* Transfer Details with Copy Buttons */}
                  <div className="bg-foreground/5 rounded-2xl p-4 space-y-2.5 text-xs font-medium mb-6">
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

                  {/* Warning / Polling Indicator */}
                  <div className="flex items-center justify-center gap-2 text-xs text-foreground/70">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Đang chờ xác nhận giao dịch từ SePay...</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="px-6 lg:px-12 max-w-5xl mx-auto mb-16">
        <div className="bg-card-bg rounded-[2rem] p-6 lg:p-8 border border-foreground/10 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-center">{t('pricing.compare')}</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="py-4 font-semibold text-foreground/60 w-[40%]">Tính năng</th>
                  <th className="py-4 font-bold text-center w-[20%]">
                    <div className="text-blue-400">Miễn phí</div>
                    <div className="text-[9px] uppercase tracking-wider bg-blue-900/40 text-blue-300 inline-block px-2 py-0.5 rounded mt-1">Mặc định</div>
                  </th>
                  <th className="py-4 font-bold text-center w-[20%]">Pro (99k)</th>
                  <th className="py-4 font-bold text-center w-[20%]">Premium (199k)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <TableRow icon={<MessageCircle className="w-4 h-4" />} title="Phỏng vấn AI" free="4" pro="25" mock="100" />
                <TableRow icon={<FileText className="w-4 h-4" />} title="Sàng lọc & Phân tích CV" free="Có" pro="Không giới hạn" mock="Không giới hạn" />
                <TableRow icon={<Repeat className="w-4 h-4" />} title="Lượt luyện tập / tháng" free="4" pro="25" mock="100" />
                <TableRow icon={<GitCommit className="w-4 h-4" />} title="Pipeline phỏng vấn đa vòng" free={true} pro={true} mock={true} />
                <TableRow icon={<Code2 className="w-4 h-4" />} title="Phỏng vấn Coding & System" free={false} pro={true} mock={true} />
                <TableRow icon={<Mic className="w-4 h-4" />} title="Phỏng vấn Giọng nói (Voice AI)" free={false} pro={true} mock={true} />
                <TableRow icon={<Users className="w-4 h-4" />} title="Custom Mock từ CV/JD cá nhân" free={false} pro={true} mock={true} />
                <TableRow icon={<FastForward className="w-4 h-4" />} title="Ưu tiên hàng đợi AI" free={false} pro={true} mock={true} />
                <tr className="border-t border-foreground/10">
                  <td className="py-6 font-bold flex items-center gap-3">
                    <Banknote className="w-4 h-4 text-foreground/60" /> Giá
                  </td>
                  <td className="py-6 font-bold text-center text-lg">0đ</td>
                  <td className="py-6 font-bold text-center text-lg text-blue-500">99k<span className="text-xs text-foreground/60 font-normal">/tháng</span></td>
                  <td className="py-6 font-bold text-center text-lg text-amber-500">199k<span className="text-xs text-foreground/60 font-normal">/tháng</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 mt-8 pt-6 border-t border-foreground/10 text-xs text-foreground/60 font-medium">
            <div className="flex items-center gap-2"><QrCode className="w-4 h-4" /> QR chuyển khoản ngân hàng SePay</div>
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> VietQR liên ngân hàng 24/7</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Kích hoạt tự động tức thì</div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="px-6 lg:px-12 max-w-3xl mx-auto mb-24">
        <h2 className="text-2xl font-bold mb-10 text-center">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          <FaqItem question="Thanh toán qua SePay VietQR hoạt động như thế nào?" answer="Khi bạn bấm chọn gói, hệ thống sẽ tạo một mã QR chứa sẵn số tiền và mã nội dung chuyển khoản. Bạn chỉ cần mở app ngân hàng bất kỳ (MBBank, Vietcombank, Techcombank, MoMo...) để quét mã và chuyển tiền. Hệ thống SePay sẽ tự động ghi nhận và kích hoạt gói cho bạn trong vòng 1-3 giây!" />
          <FaqItem question="Tôi có cần nhập nội dung chuyển khoản thủ công không?" answer="Khi quét mã QR, app ngân hàng sẽ tự động điền đầy đủ số tài khoản, số tiền và mã nội dung. Nếu bạn chuyển khoản thủ công, hãy nhớ copy đúng nội dung chuyển khoản hiển thị trên màn hình để hệ thống tự động kích hoạt nhé." />
          <FaqItem question="Hết lượt phỏng vấn trong gói thì sao?" answer="Bạn có thể tiếp tục gia hạn hoặc nâng cấp gói để nhận thêm lượt phỏng vấn mới mà không bị gián đoạn quá trình luyện tập." />
          <FaqItem question="Thanh toán có an toàn không?" answer="Hoàn toàn an toàn. Bạn chuyển tiền trực tiếp từ ứng dụng ngân hàng của mình tới tài khoản ngân hàng chính thức của hệ thống được bảo đảm bởi SePay." />
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Subcomponents

function FeatureItem({ text, included, blueIcon = false }: { text: string, included: boolean, blueIcon?: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm font-medium ${included ? 'text-foreground/90' : 'text-foreground/40'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        included 
          ? blueIcon ? 'text-blue-500' : 'border border-blue-500 text-blue-500' 
          : 'border border-foreground/20 text-foreground/30'
      }`}>
        {included ? (
           blueIcon ? <Check className="w-4 h-4 stroke-[3]" /> : <Check className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </div>
      {text}
    </li>
  );
}

function TableRow({ icon, title, free, pro, mock }: { icon: React.ReactNode, title: string, free: string | boolean, pro: string | boolean, mock: string | boolean }) {
  
  const renderValue = (val: string | boolean) => {
    if (typeof val === 'string') return <span className="font-semibold text-foreground/80">{val}</span>;
    if (val === true) return <Check className="w-5 h-5 text-blue-500 mx-auto" />;
    return <X className="w-5 h-5 text-foreground/30 mx-auto" />;
  };

  return (
    <tr className="border-b border-foreground/10 hover:bg-foreground/[0.02] transition-colors">
      <td className="py-3 flex items-center gap-3 text-foreground/70 font-medium">
        {icon} {title}
      </td>
      <td className="py-3 text-center">{renderValue(free)}</td>
      <td className="py-3 text-center">{renderValue(pro)}</td>
      <td className="py-3 text-center">{renderValue(mock)}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-card-bg border border-foreground/10 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-foreground hover:bg-foreground/[0.02] transition-colors"
      >
        {question}
        <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-6 py-4 text-sm text-foreground/70 leading-relaxed bg-foreground/[0.02] border-t border-foreground/5"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}
