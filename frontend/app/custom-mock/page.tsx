'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import {
  Info, Server, Monitor, Layers, Smartphone, Infinity as InfinityIcon,
  Database, LineChart, Brain, Shield, CheckCircle, Cpu, Link as LinkIcon,
  Gamepad2, Building2, Briefcase, MapPin, Clock, ArrowRight,
  ArrowLeft, Play, Zap, Award, Sparkles, CheckCircle2,
  Mic, MicOff, Volume2, Square, Phone, FileText, Upload,
  Lock, Copy, CheckCheck, Loader2, X, QrCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { JobResponse, MockSessionResponse, SessionQuestionResponse } from '@/types/api';


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

export default function CustomMockPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('Tất cả');
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [view, setView] = useState<'list' | 'detail' | 'interview' | 'voice-interview' | 'loading' | 'custom-setup'>('custom-setup');

  // Custom Mock State
  const [customMockType, setCustomMockType] = useState<'cv' | 'jd'>('cv');
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(7);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [loadingStepText, setLoadingStepText] = useState('Đang khởi tạo buổi phỏng vấn...');
  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvFileUploading, setCvFileUploading] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // Auth & Upgrade Modal State
  const { user, refreshUser } = useAuth();
  const isProOrPremium = Boolean(user && (user.plan === 'pro' || user.plan === 'premium'));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<'text' | 'voice'>('text');
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


  // Text interview state
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [interviewTimer, setInterviewTimer] = useState(0);

  // Voice interview state
  const [voiceMessages, setVoiceMessages] = useState<{role: 'ai' | 'user'; content: string}[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<number | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Refs to avoid stale closures in recognition callbacks
  const isRecordingRef = useRef(false);
  const voiceMessagesRef = useRef<{role: 'ai' | 'user'; content: string}[]>([]);
  // Store first question TTS text — triggered by useEffect after view renders
  const pendingFirstTTSRef = useRef<string | null>(null);

  // Keep voiceMessagesRef in sync with state
  useEffect(() => {
    voiceMessagesRef.current = voiceMessages;
  }, [voiceMessages]);

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

  // Timer Effect for Live Interview
  useEffect(() => {
    let timerId: any;
    if (view === 'interview' || view === 'voice-interview') {
      timerId = setInterval(() => {
        setInterviewTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [view]);

  // Auto-scroll voice chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceMessages, liveTranscript]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      ttsAbortRef.current?.abort();
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchCategory = activeCategory === 'all' || job.category === activeCategory;
    const matchLevel = activeLevel === 'Tất cả' || job.level === activeLevel;
    return matchCategory && matchLevel;
  });

  const currentJob = jobs.find(j => j.id === selectedJobId);

  // --- Voice Interview Helpers ---
  const playTTS = useCallback(async (text: string) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    setIsAISpeaking(true);

    const abort = new AbortController();
    ttsAbortRef.current = abort;

    const rawSentences = (text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g) || [text])
      .map(s => s.trim()).filter(s => s.length > 0);
    // Merge short fragments (< 10 chars) with next sentence to avoid TTS failures
    const sentences: string[] = [];
    for (const s of rawSentences) {
      if (sentences.length > 0 && sentences[sentences.length - 1].length < 10) {
        sentences[sentences.length - 1] += ' ' + s;
      } else {
        sentences.push(s);
      }
    }
    if (sentences.length > 0 && sentences[sentences.length - 1].length < 10 && sentences.length > 1) {
      const last = sentences.pop()!;
      sentences[sentences.length - 1] += ' ' + last;
    }

    if (sentences.length === 0) { setIsAISpeaking(false); return; }

    const fetchPromises = sentences.map(sentence =>
      fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence }),
        signal: abort.signal,
      })
      .then(res => { if (!res.ok) throw new Error('TTS failed'); return res.arrayBuffer(); })
      .then(buf => ctx.decodeAudioData(buf))
      .catch(() => null)
    );

    try {
      await ctx.resume();
      for (let i = 0; i < fetchPromises.length; i++) {
        if (abort.signal.aborted) break;
        const audioBuffer = await fetchPromises[i];
        if (!audioBuffer || abort.signal.aborted) continue;
        await new Promise<void>((resolve) => {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.onended = () => { audioSourceRef.current = null; resolve(); };
          audioSourceRef.current = source;
          source.start();
        });
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error('[TTS] Playback error:', e);
      }
    }
    setIsAISpeaking(false);
    ttsAbortRef.current = null;
  }, []);

  // Play first AI question TTS once the voice-interview view is mounted
  // Must be defined AFTER playTTS to avoid temporal dead zone
  useEffect(() => {
    if (view === 'voice-interview' && pendingFirstTTSRef.current) {
      const text = pendingFirstTTSRef.current;
      pendingFirstTTSRef.current = null;
      const timer = setTimeout(() => playTTS(text), 400);
      return () => clearTimeout(timer);
    }
  }, [view, playTTS]);

  const sendVoiceMessage = useCallback(async (text: string, sessionId: number) => {
    // Read from ref so we always get the latest messages, no stale closure
    const history = voiceMessagesRef.current.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));

    setIsAIThinking(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const res = await fetch(`/api/voice/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error('Voice message failed');
      const data = await res.json();
      const aiText = data.response;
      setVoiceMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      setIsAIThinking(false);
      await playTTS(aiText);
    } catch {
      setIsAIThinking(false);
      setVoiceMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, có lỗi xảy ra. Hãy thử lại.' }]);
    }
  }, [playTTS]);

  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(16).fill(0));
  const [voiceTextInput, setVoiceTextInput] = useState('');
  const speechRecognitionRef = useRef<any>(null);
  const recordedSpeechTextRef = useRef<string>('');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    isRecordingRef.current = true;
    setIsRecording(true);
    setLiveTranscript('');
    recordedSpeechTextRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const NUM_BARS = 16;

        const checkAudio = () => {
          if (!isRecordingRef.current) return;
          analyser.getByteFrequencyData(dataArray);

          const sampledBars: number[] = [];
          let totalVolume = 0;

          for (let i = 0; i < NUM_BARS; i++) {
            const binIdx = Math.min(dataArray.length - 1, Math.floor((i / NUM_BARS) * (dataArray.length * 0.75)) + 1);
            const val = dataArray[binIdx] || 0;
            sampledBars.push(val);
            totalVolume += val;
          }

          setFrequencies(sampledBars);
          setAudioLevel(Math.min(100, Math.round(totalVolume / NUM_BARS)));
          animFrameRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
      }


      const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'vi-VN';
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              const item = event.results[i][0];
              if (item && item.transcript) {
                fullTranscript += (fullTranscript ? ' ' : '') + item.transcript.trim();
              }
            }

            const cleaned = fullTranscript.trim();
            console.log('[STT custom-mock] onresult text:', cleaned);
            if (cleaned) {
              recordedSpeechTextRef.current = cleaned;
              setLiveTranscript(cleaned);
              setVoiceTextInput(cleaned);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[STT] SpeechRecognition error in custom-mock:', event.error);
          };

          recognition.onend = () => {
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current) {
                  try {
                    recognition.start();
                  } catch (e) {
                    console.warn('[STT] Auto-restart custom-mock:', e);
                  }
                }
              }, 150);
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.error('[STT] recognition.start() error in custom-mock:', e);
        }
      }

    } catch (err: any) {
      console.error('[STT] custom-mock mic error:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền micro trên trình duyệt của bạn.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
      speechRecognitionRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    const currentText = (recordedSpeechTextRef.current || liveTranscript || voiceTextInput).trim();
    if (currentText && currentText !== 'Đang lắng nghe câu trả lời của bạn...' && voiceSessionId) {
      setLiveTranscript('');
      setVoiceTextInput('');
      setVoiceMessages(prev => [...prev, { role: 'user', content: currentText }]);
      sendVoiceMessage(currentText, voiceSessionId);
    } else {
      setLiveTranscript('');
    }
  }, [voiceSessionId, sendVoiceMessage, liveTranscript, voiceTextInput]);



  const handleStartVoiceInterview = async () => {
    if (!selectedJobId) return;
    // Create AudioContext during user gesture — bypasses browser autoplay policy
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setView('loading');
    setLoadingStepText(cvText.trim() ? 'Đang phân tích CV và cá nhân hóa câu hỏi...' : 'Đang khởi tạo phỏng vấn giọng nói...');

    try {
      const body: any = { job_id: selectedJobId, questions_count: currentJob?.rounds || 7 };
      if (cvText.trim()) body.cv_text = cvText.trim();

      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data && data.id) {
        setVoiceSessionId(data.id);
        setVoiceMessages([]);
        setInterviewTimer(0);
        setLiveTranscript('');

        const firstQuestion = data.questions?.[0]?.questionText || 'Xin chào, hãy giới thiệu bản thân bạn.';
        setVoiceMessages([{ role: 'ai', content: firstQuestion }]);
        pendingFirstTTSRef.current = firstQuestion;
        setView('voice-interview');
      } else {
        throw new Error('Invalid session');
      }
    } catch (err) {
      console.error('[Voice] Failed to start session:', err);
      setView('detail');
    }
  };

  const handleEndVoiceInterview = () => {
    ttsAbortRef.current?.abort();
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsAISpeaking(false);

    if (voiceSessionId) {
      handleEvaluateVoiceSession();
    } else {
      setView('detail');
    }
  };

  const handleEvaluateVoiceSession = async () => {
    setView('loading');
    setLoadingStepText('Đang nộp bài phỏng vấn giọng nói...');

    const steps = [
      'Đang nộp bài phỏng vấn giọng nói...',
      'AI đang phân tích toàn bộ câu trả lời...',
      'Đang chấm điểm và highlight các ý chính...',
      'Đang tổng hợp ưu điểm & điểm cần cải thiện...',
      'Hoàn tất! Đang chuyển bạn đến trang kết quả...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStepText(steps[stepIdx]);
      }
    }, 2200);

    if (voiceSessionId) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
        const res = await fetch(`/api/sessions/${voiceSessionId}/evaluate`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          clearInterval(interval);
          setLoadingStepText('Phân tích hoàn tất! Đang mở bảng điểm...');
          setTimeout(() => { window.location.href = '/history'; }, 1000);
          return;
        } else {
            console.error("Voice evaluate returned error", res.status);
            alert("Lỗi khi chấm điểm! Vui lòng thử lại.");
            setView('detail');
        }
      } catch (err) {
        console.error('Voice evaluate failed', err);
        alert("Lỗi kết nối khi chấm điểm! Vui lòng thử lại.");
        setView('detail');
      }
    } else {
        window.location.href = '/history';
    }
  };

  const handleCvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFileUploading(true);
    setCvFileName(file.name);
    setCvText('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const res = await fetch('/api/sessions/parse-cv', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload thất bại');
      }
      const data = await res.json();
      setCvText(data.text);
    } catch (err: any) {
      setCvFileName('');
      alert(`Lỗi đọc file: ${err.message}`);
    } finally {
      setCvFileUploading(false);
      if (cvFileInputRef.current) cvFileInputRef.current.value = '';
    }
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
                setPaymentInfo(null);
                startActualCustomInterview(pendingMode);
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

  const handleStartCustomInterview = async (mode: 'text' | 'voice' = 'text') => {
    if (!customFile) {
      alert('Vui lòng upload file CV hoặc JD.');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!isProOrPremium) {
      setPendingMode(mode);
      setShowUpgradeModal(true);
      return;
    }

    startActualCustomInterview(mode);
  };

  const startActualCustomInterview = async (mode: 'text' | 'voice' = 'text') => {
    setView('loading');
    setLoadingStepText('Đang phân tích file bằng Pinecone Vector DB và sinh câu hỏi...');

    const formData = new FormData();
    formData.append('file', customFile!);
    formData.append('type', customMockType);
    formData.append('questions_count', customQuestionCount.toString());

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/sessions/custom-mock', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data && data.id) {
        if (mode === 'voice') {
          router.push(`/interview/${data.id}?mode=voice`);
        } else {
          router.push(`/interview/${data.id}`);
        }
      } else {
        throw new Error(data.detail || "Không thể khởi tạo session (lỗi server).");
      }
    } catch (err: any) {
      console.error("[Custom Mock] API start failed:", err);
      alert(`Đã xảy ra lỗi: ${err.message}`);
      setView('custom-setup');
    }
  };


  const handleStartInterview = async () => {
    if (!selectedJobId) return;
    setView('loading');
    setLoadingStepText(cvText.trim() ? 'Đang phân tích CV và cá nhân hóa câu hỏi...' : 'Đang kết nối với AI và sinh câu hỏi...');

    try {
      const body: any = { job_id: selectedJobId, questions_count: currentJob?.rounds || 7 };
      if (cvText.trim()) body.cv_text = cvText.trim();

      const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Không thể khởi tạo session (lỗi server AI).");
      }


      if (data && data.id && Array.isArray(data.questions) && data.questions.length > 0) {
        setCurrentSessionId(data.id);
        setSessionQuestions(data.questions || []);
        setCurrentQuestionIndex(0);
        setUserAnswerText('');
        setInterviewTimer(0);
        setView('interview');
      } else {
        throw new Error("Không nhận được danh sách câu hỏi hợp lệ từ AI.");
      }
    } catch (err: any) {
      console.error("[Interview] API start failed:", err);
      alert(`⚠️ Lỗi kết nối AI khi tạo phiên phỏng vấn:\n${err.message || 'Vui lòng kiểm tra lại API Key hoặc kết nối mạng.'}`);
      setView('custom-setup');
    }
  };




  const handleSubmitAnswer = async () => {
    const currentQ = sessionQuestions[currentQuestionIndex];
    if (!currentQ) return;

    // Call submit endpoint if sessionId exists
    if (currentSessionId) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
        await fetch(`/api/sessions/${currentSessionId}/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
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
      'AI đang phân tích toàn bộ câu trả lời...',
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('mockitv_token') : null;
        const res = await fetch(`/api/sessions/${currentSessionId}/evaluate`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          clearInterval(interval);
          setLoadingStepText('Phân tích hoàn tất! Đang mở bảng điểm của bạn...');
          setTimeout(() => {
            window.location.href = '/history';
          }, 1000);
          return;
        } else {
            console.error("API evaluate returned error", res.status);
            alert("Lỗi khi chấm điểm! Vui lòng thử lại.");
            setView('detail');
        }
      } catch (err) {
        console.error("API evaluate failed", err);
        alert("Lỗi kết nối khi chấm điểm! Vui lòng thử lại.");
        setView('detail');
      }
    } else {
        window.location.href = '/history';
    }
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
                  Chọn vị trí mong muốn của bạn để phỏng vấn thử 1-1 với MockITV AI, nhận đánh giá chi tiết từng câu trả lời.
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
                        onClick={() => { setSelectedJobId(job.id); setView('detail'); setCvText(''); setCvFileName(''); }}
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
                            {job.techStack.map((tech: string) => (
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
                  onClick={() => { setSelectedJobId(null); setView('list'); setCvText(''); setCvFileName(''); }}
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
                      {currentJob.techStack.map((tech: string) => (
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

                  {/* CV Input Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Cá nhân hóa với CV của bạn
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 normal-case">(tùy chọn)</span>
                    </h2>
                    <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-5 space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Upload hoặc paste CV để AI sinh câu hỏi sát kinh nghiệm thực tế — tham chiếu đúng dự án, skill và điểm yếu của bạn.
                      </p>

                      {/* Upload button */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => cvFileInputRef.current?.click()}
                          disabled={cvFileUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-200 dark:border-white/10"
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          {cvFileUploading ? 'Đang đọc file...' : 'Upload PDF / DOCX'}
                        </button>
                        {cvFileName && !cvFileUploading && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 truncate max-w-[180px]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {cvFileName}
                          </span>
                        )}
                        {cvText.trim() && (
                          <button
                            onClick={() => { setCvText(''); setCvFileName(''); }}
                            className="text-xs text-rose-500 hover:text-rose-600 font-bold ml-auto flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20"
                          >
                            <X className="w-3.5 h-3.5" />
                            Xóa CV (Dùng câu hỏi chuẩn)
                          </button>
                        )}
                      </div>


                      <input
                        ref={cvFileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={handleCvFileUpload}
                      />

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                        hoặc paste trực tiếp
                        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                      </div>

                      <textarea
                        value={cvText}
                        onChange={(e) => { setCvText(e.target.value); if (!e.target.value) setCvFileName(''); }}
                        placeholder="Paste nội dung CV của bạn vào đây..."
                        className="w-full min-h-[140px] p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm resize-y"
                      />
                      {cvText.trim() && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          AI sẽ phân tích CV và cá nhân hóa {currentJob?.rounds || 7} câu hỏi cho bạn
                        </p>
                      )}
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

                    <button
                      onClick={handleStartVoiceInterview}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Phỏng vấn giọng nói
                    </button>

                    <div className="pt-4 border-t border-white/5 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <Sparkles className="w-4 h-4 fill-emerald-500/10" />
                      MockITV Premium (Không giới hạn)
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
              VIEW 4: VOICE INTERVIEW (LINKEDIN-STYLE)
             ========================================== */}
          {view === 'voice-interview' && (
            <motion.div
              key="voice-interview-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0B1120] flex flex-col items-center overflow-y-auto"
            >
              {/* Header */}
              <div className="text-center pt-14 pb-6 px-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 justify-center">
                  Mock Interview — {currentJob?.title}
                </h2>
                <p className="text-slate-400 mt-1.5 font-mono text-base">{formatTimer(interviewTimer)}</p>
              </div>

              {/* Avatar Card */}
              <div className="bg-[#151E32] rounded-3xl border border-slate-700/50 shadow-2xl shadow-blue-500/5 px-14 py-10 flex gap-16 items-end mx-6">
                {/* You */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-4xl select-none shadow-inner border-2 transition-all duration-300 relative ${
                    isRecording 
                      ? 'border-emerald-400 ring-4 ring-emerald-400/40 ring-offset-4 ring-offset-[#151E32]' 
                      : 'border-slate-600'
                  }`}>
                    {isRecording && (
                      <div 
                        className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" 
                        style={{ animationDuration: audioLevel > 15 ? '1s' : '2s' }}
                      />
                    )}
                    🧑
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-200 text-sm">You</p>
                    <p className="text-xs text-slate-500">
                      {isRecording ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {audioLevel > 5 ? 'Đang nhận mic 🟢' : 'Đang lắng nghe...'}
                        </span>
                      ) : (
                        'Interviewee'
                      )}
                    </p>
                  </div>
                </div>

                {/* AI Interviewer */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative transition-all duration-300 border-2 border-blue-500/30 ${isAISpeaking ? 'ring-4 ring-blue-400/50 ring-offset-4 ring-offset-[#151E32]' : ''}`}>
                    {isAISpeaking && (
                      <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
                    )}
                    <Sparkles className="w-10 h-10 text-blue-200 relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-200 text-sm">MockITV AI</p>
                    <p className="text-xs text-slate-500">
                      {isAISpeaking ? (
                        <span className="text-blue-400 font-semibold flex items-center gap-1 justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          Đang trả lời...
                        </span>
                      ) : isAIThinking ? (
                        <span className="text-amber-400 font-semibold">Đang suy nghĩ...</span>
                      ) : (
                        'Interviewer'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real Acoustic Frequency Visualizer when recording */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1.5 mt-5 h-10 px-5 py-1.5 bg-[#151E32]/80 rounded-full border border-emerald-500/25 shadow-lg backdrop-blur-md">
                  {frequencies.map((val, i) => {
                    const barHeight = Math.max(4, Math.min(32, Math.round((val / 255) * 28) + 4));
                    return (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full transition-all duration-75 ease-out"
                        style={{
                          height: `${barHeight}px`,
                          opacity: val > 15 ? 1 : 0.35,
                          boxShadow: val > 40 ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              )}


              {/* Current message / transcript */}
              <div className="max-w-xl w-full px-6 mt-5 space-y-3">
                {isAIThinking ? (
                  <div className="bg-[#1a2540] rounded-2xl px-6 py-4 text-center flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : voiceMessages.length > 0 ? (
                  <p className="bg-[#1a2540] border border-slate-700/30 rounded-2xl px-6 py-4 text-sm text-slate-200 text-center leading-relaxed">
                    {voiceMessages[voiceMessages.length - 1].content}
                  </p>
                ) : null}

                {(isRecording || liveTranscript) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-sm text-emerald-300 leading-relaxed font-medium">
                      {liveTranscript || <span className="text-emerald-400/60 italic">Hãy nói câu trả lời của bạn vào micro...</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-6" />

              {/* Bottom Interactive Voice & Text Bar */}
              <div className="pb-8 flex flex-col items-center gap-4 w-full max-w-xl px-6">
                {/* Quick text input fallback */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (voiceTextInput.trim() && voiceSessionId) {
                      const text = voiceTextInput.trim();
                      if (isRecording) stopRecording();
                      setVoiceTextInput('');
                      setLiveTranscript('');
                      setVoiceMessages(prev => [...prev, { role: 'user', content: text }]);
                      sendVoiceMessage(text, voiceSessionId);
                    }
                  }}
                  className="w-full flex items-center gap-2 bg-[#151E32] border border-slate-700/60 rounded-full px-4 py-2 shadow-lg"
                >
                  <input
                    type="text"
                    value={voiceTextInput}
                    onChange={(e) => {
                      setVoiceTextInput(e.target.value);
                      if (e.target.value) setLiveTranscript(e.target.value);
                    }}
                    placeholder="Hoặc gõ/chỉnh sửa câu trả lời tại đây..."
                    disabled={isAISpeaking || isAIThinking}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none px-2"
                  />
                  {voiceTextInput.trim() && (
                    <button
                      type="submit"
                      disabled={isAISpeaking || isAIThinking}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-colors shrink-0"
                    >
                      Gửi ngay
                    </button>
                  )}
                </form>

                {/* Primary Voice Action Bar */}
                <div className="flex items-center gap-4 bg-[#151E32] rounded-full border border-slate-700/50 shadow-2xl px-6 py-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAISpeaking || isAIThinking}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow active:scale-95 disabled:opacity-40 cursor-pointer ${
                      isRecording
                        ? 'bg-red-500 shadow-red-500/40 ring-4 ring-red-400/40 animate-pulse'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                    }`}
                    title={isRecording ? "Nhấn để dừng và gửi câu trả lời" : "Nhấn để bắt đầu nói"}
                  >
                    <Mic className={`w-6 h-6 text-white ${isRecording ? 'animate-bounce' : ''}`} />
                  </button>

                  <div className="text-left pr-2">
                    <p className="text-xs font-bold text-slate-200">
                      {isRecording ? "Đang ghi âm..." : "Bấm Micro để nói"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isRecording ? "Nói xong bấm lại để gửi" : "Hỗ trợ tiếng Việt & tiếng Anh"}
                    </p>
                  </div>

                  <div className="w-px h-6 bg-slate-700" />
                  <button
                    onClick={handleEndVoiceInterview}
                    className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs px-2 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Kết thúc
                  </button>
                </div>
              </div>
            </motion.div>
          )}


          {/* ==========================================
              VIEW 3: CUSTOM MOCK SETUP
             ========================================== */}
          {view === 'custom-setup' && (
            <motion.div
              key="custom-setup-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl px-6 lg:px-12 flex flex-col"
            >
              <div className="mb-6 self-start">
                <button
                  onClick={() => { setView('list'); setCustomFile(null); setCvText(''); setCvFileName(''); }}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-extrabold transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại danh sách
                </button>
              </div>


              <div className="bg-card-bg border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:p-10 shadow-md">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-blue-500 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                      Phỏng vấn Tùy chỉnh
                    </h1>
                    <p className="text-slate-500 mt-2">Tạo buổi phỏng vấn dựa trên CV cá nhân hoặc JD cụ thể.</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => setCustomMockType('cv')}
                    className={`flex-1 py-4 px-6 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 ${customMockType === 'cv' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <FileText className="w-8 h-8" />
                    Phân tích CV
                  </button>
                  <button 
                    onClick={() => setCustomMockType('jd')}
                    className={`flex-1 py-4 px-6 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 ${customMockType === 'jd' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Briefcase className="w-8 h-8" />
                    Phân tích Job Description
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Question count */}
                  <div>
                    <label className="block text-sm font-bold mb-3">Số lượng câu hỏi phỏng vấn ({customQuestionCount} câu):</label>
                    <input 
                      type="range" 
                      min="3" 
                      max="10" 
                      value={customQuestionCount} 
                      onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-bold">
                      <span>3 câu</span>
                      <span>10 câu</span>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-bold mb-3">Upload File (PDF/DOCX):</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm font-semibold text-slate-500">
                          {customFile ? customFile.name : <><span className="text-blue-500">Click để upload</span> hoặc kéo thả file</>}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        accept=".pdf,.docx" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCustomFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-end gap-3">
                  <button 
                    onClick={() => handleStartCustomInterview('text')}
                    disabled={!customFile}
                    className={`flex items-center justify-center gap-2 px-8 py-4 font-extrabold rounded-2xl transition-all shadow-lg cursor-pointer ${
                      !isProOrPremium
                        ? 'bg-blue-600/85 hover:bg-blue-600 text-white border border-amber-400/40 opacity-90 hover:opacity-100 hover:scale-[1.01]'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {!isProOrPremium && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-black mr-1">
                        <Lock className="w-3 h-3 text-amber-400" /> PRO
                      </span>
                    )}
                    <span>Bắt đầu phỏng vấn text</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => handleStartCustomInterview('voice')}
                    disabled={!customFile}
                    className={`flex items-center justify-center gap-2 px-8 py-4 font-extrabold rounded-2xl transition-all shadow-lg cursor-pointer ${
                      !isProOrPremium
                        ? 'bg-gradient-to-r from-indigo-600/85 to-purple-600/85 hover:from-indigo-600 hover:to-purple-600 text-white border border-amber-400/40 opacity-90 hover:opacity-100 hover:scale-[1.01]'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {!isProOrPremium && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-black mr-1">
                        <Lock className="w-3 h-3 text-amber-400" /> PRO
                      </span>
                    )}
                    <Phone className="w-5 h-5" />
                    <span>Phỏng vấn giọng nói</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==========================================
              VIEW 5: IMMERSIVE AI LOADER SCREEN
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
                <h3 className="text-xl font-black text-white">
                  {loadingStepText.includes('chấm điểm') || loadingStepText.includes('nộp bài') || loadingStepText.includes('phân tích') 
                    ? 'Đang xử lý kết quả' 
                    : 'Hệ thống đang khởi tạo'}
                </h3>
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
              {/* Close Button */}
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
                  /* Success State */
                  <div className="py-8 text-center space-y-5">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                      <CheckCheck className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-foreground mb-1">
                        Kích hoạt thành công! 🎉
                      </h3>
                      <p className="text-sm text-foreground/70">
                        Đang tự động khởi tạo buổi phỏng vấn cho hồ sơ của bạn...
                      </p>
                    </div>
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
                        className="w-48 h-48 object-contain"
                      />
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">
                        Mở app ngân hàng bất kỳ để quét mã VietQR
                      </span>
                    </div>

                    {/* Transfer Details */}
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
                /* Plan Selection State */
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">
                      Mở khóa Phỏng vấn Tùy chỉnh
                    </h3>
                    <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto leading-relaxed">
                      Tính năng phân tích CV/JD bằng AI Vector DB chuyên sâu dành riêng cho thành viên gói <strong>Pro</strong> và <strong>Premium</strong>.
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {/* Option Pro */}
                    <div
                      onClick={() => handleCreatePaymentOrder('pro')}
                      className="p-4 rounded-2xl border-2 border-blue-500/40 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">Gói Pro (Phổ biến)</span>
                          <span className="text-[10px] font-black uppercase bg-gradient-to-r from-red-500 to-amber-500 text-white px-2 py-0.5 rounded-full">🔥 Giảm 80%: 19k</span>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1">30 lượt phỏng vấn AI, Full Voice AI, Custom Mock CV/JD</p>
                      </div>
                      <button
                        disabled={loadingPlan === 'pro'}
                        className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl group-hover:bg-blue-600 transition-colors shrink-0"
                      >
                        {loadingPlan === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chọn gói'}
                      </button>
                    </div>

                    {/* Option Premium */}
                    <div
                      onClick={() => handleCreatePaymentOrder('premium')}
                      className="p-4 rounded-2xl border border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">Gói Premium VIP</span>
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">🔥 Giảm 80%: 39k</span>
                        </div>
                        <p className="text-xs text-foreground/60 mt-1">100 lượt phỏng vấn, Hàng đợi ưu tiên tối đa 24/7</p>
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
