'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Đăng nhập để tiếp tục',
  subtitle = 'Đăng nhập chỉ với 1 chạm bằng Google để mở phiên phỏng vấn và nhận đánh giá AI chuyên sâu.',
}: LoginModalProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError(null);
      if (!credentialResponse.credential) {
        throw new Error('Không nhận được thông tin xác thực từ Google');
      }
      const ok = await loginWithGoogle(credentialResponse.credential);
      if (ok) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Login modal error:', err);
      setError(err.message || 'Đăng nhập với Google thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/60 rounded-3xl p-7 sm:p-9 shadow-2xl text-white z-10 overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center text-3xl font-extrabold tracking-tight mb-3">
                <span className="text-blue-400">Mock</span>
                <span className="text-emerald-400 relative">
                  ITV
                  <Sparkles className="absolute -top-2.5 -right-3.5 w-4 h-4 text-emerald-300" />
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed px-2">
                {subtitle}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="flex flex-col items-center justify-center my-6 min-h-[50px]">
              {loading ? (
                <div className="flex items-center justify-center gap-2.5 py-3 px-6 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Đang kết nối tài khoản Google...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center scale-[1.05]">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Sign-In gặp sự cố kết nối')}
                    useOneTap={false}
                    theme="filled_blue"
                    shape="pill"
                    size="large"
                    text="continue_with"
                  />
                </div>
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-slate-500 leading-relaxed">
              Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của MockITV.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
