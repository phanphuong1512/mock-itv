'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Clock, Brain, Sparkles, Phone, Mic, Play
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MockSessionResponse, SessionQuestionResponse } from '@/types/api';

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') === 'voice' ? 'voice' : 'text';
  const resolvedParams = use(params);
  const sessionId = parseInt(resolvedParams.id);

  const [session, setSession] = useState<MockSessionResponse | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState<'loading' | 'interview' | 'voice-ready' | 'voice-interview'>('loading');
  const [loadingStepText, setLoadingStepText] = useState('Đang tải dữ liệu phỏng vấn...');

  // Text interview state
  const [userAnswerText, setUserAnswerText] = useState('');
  const [interviewTimer, setInterviewTimer] = useState(0);

  // Voice interview state
  const [voiceMessages, setVoiceMessages] = useState<{role: 'ai' | 'user'; content: string}[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamingAIText, setStreamingAIText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  
  const isRecordingRef = useRef(false);
  const voiceMessagesRef = useRef<{role: 'ai' | 'user'; content: string}[]>([]);
  const firstQuestionRef = useRef<string>('');
  const audioQueueRef = useRef<Promise<Blob | null>[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    voiceMessagesRef.current = voiceMessages;
  }, [voiceMessages]);

  // Timer Effect
  useEffect(() => {
    let timerId: any;
    if (view === 'interview' || view === 'voice-interview') {
      timerId = setInterval(() => {
        setInterviewTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [view]);

  // Fetch session data
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error("Không tìm thấy session.");
        return res.json();
      })
      .then((data: MockSessionResponse) => {
        setSession(data);
        if (data.questions && data.questions.length > 0) {
          setSessionQuestions(data.questions);
          if (mode === 'voice') {
            const firstQuestion = data.questions[0].questionText || data.questions[0].text || 'Xin chào, hãy giới thiệu bản thân bạn.';
            firstQuestionRef.current = firstQuestion;
            setView('voice-ready');
          } else {
            setView('interview');
          }
        } else {
          alert("Phiên phỏng vấn không có câu hỏi hợp lệ. Đang chuyển về trang danh sách mock.");
          router.push('/mocks');
        }
      })
      .catch(err => {
        console.error("Failed to fetch session", err);
        alert("Không thể tải dữ liệu phiên phỏng vấn.");
        router.push('/mocks');
      });
  }, [sessionId, mode, router]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try { 
          const { stream, audioCtx, processor, ws } = recognitionRef.current;
          processor.disconnect();
          stream.getTracks().forEach((t: any) => t.stop());
          audioCtx.close();
          ws.close();
        } catch {}
      }
      ttsAbortRef.current?.abort();
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch {}
      }
    };
  }, []);

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

  // --- Audio Queue Player ---
  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) {
      setIsAISpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    
    try {
      const blobPromise = audioQueueRef.current.shift()!;
      const blob = await blobPromise;

      if (blob) {
        await new Promise<void>((resolve) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
            isPlayingRef.current = false;
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
            isPlayingRef.current = false;
            resolve();
          };
          audio.play().catch(() => {
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
            isPlayingRef.current = false;
            resolve();
          });
        });
      } else {
        isPlayingRef.current = false;
      }
    } catch (e) {
      isPlayingRef.current = false;
    }

    // Play next in queue
    playNextInQueue();
  }, []);

  // --- Fetch TTS for a single sentence and return a Promise ---
  const fetchTTS = async (text: string, abort: AbortController): Promise<Blob | null> => {
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abort.signal,
      });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  // --- Play TTS for full text (used for first question) ---
  const playTTS = useCallback(async (text: string) => {
    setIsAISpeaking(true);
    const abort = new AbortController();
    ttsAbortRef.current = abort;

    const rawSentences = (text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g) || [text])
      .map(s => s.trim()).filter(s => s.length > 0);
    const sentences: string[] = [];
    for (const s of rawSentences) {
      if (sentences.length > 0 && sentences[sentences.length - 1].length < 10) {
        sentences[sentences.length - 1] += ' ' + s;
      } else {
        sentences.push(s);
      }
    }

    if (sentences.length === 0) { setIsAISpeaking(false); return; }

    // Fire off all TTS requests in parallel
    const fetchPromises = sentences.map(sentence =>
      fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence }),
        signal: abort.signal,
      })
      .then(res => { if (!res.ok) throw new Error('TTS failed'); return res.blob(); })
      .catch(() => null)
    );

    try {
      for (let i = 0; i < fetchPromises.length; i++) {
        if (abort.signal.aborted) break;
        const blob = await fetchPromises[i];
        if (!blob || abort.signal.aborted) continue;
        await new Promise<void>((resolve) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); });
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsAISpeaking(false);
    ttsAbortRef.current = null;
  }, []);

  // --- Handle "Bắt đầu" button click ---
  const handleStartVoiceInterview = useCallback(async () => {
    const firstQ = firstQuestionRef.current;
    setVoiceMessages([{ role: 'ai', content: firstQ }]);
    setView('voice-interview');

    // Play TTS for first question
    setTimeout(() => playTTS(firstQ), 300);
  }, [playTTS]);

  // --- Streaming AI voice message ---
  const sendVoiceMessage = useCallback(async (text: string) => {
    const history = voiceMessagesRef.current.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));

    setIsAIThinking(true);
    setStreamingAIText('');

    const abort = new AbortController();
    ttsAbortRef.current = abort;

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    try {
      const res = await fetch(`/api/voice/sessions/${sessionId}/message-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error('Stream failed');
      
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      setIsAIThinking(false);
      setIsAISpeaking(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'sentence') {
              fullText += (fullText ? ' ' : '') + data.text;
              setStreamingAIText(fullText);
              
              // Fire TTS for this sentence immediately
              const ttsPromise = fetchTTS(data.text, abort);
              audioQueueRef.current.push(ttsPromise as any);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            
            if (data.type === 'done') {
              fullText = data.full_text || fullText;
              setStreamingAIText('');
              setVoiceMessages(prev => [...prev, { role: 'ai', content: fullText }]);
            }

            if (data.type === 'error') {
              console.error('Stream error:', data.message);
              setStreamingAIText('');
              const errMsg = "Xin lỗi, đã có lỗi. Bạn có thể nói lại không?";
              setVoiceMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
              await playTTS(errMsg);
            }
          } catch {}
        }
      }

      // Wait for remaining audio to finish playing
      while (audioQueueRef.current.length > 0 || isPlayingRef.current) {
        await new Promise(r => setTimeout(r, 200));
      }

    } catch (err) {
      console.error("AI response error", err);
      setIsAIThinking(false);
      const errMsg = "Xin lỗi, đã có lỗi kết nối. Bạn có thể nói lại được không?";
      setVoiceMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
      await playTTS(errMsg);
    } finally {
      setIsAISpeaking(false);
      setIsAIThinking(false);
      ttsAbortRef.current = null;
    }
  }, [sessionId, playTTS, playNextInQueue]);

  // --- Audio Analyzer & STT Engine ---
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(16).fill(0));
  const [voiceTextInput, setVoiceTextInput] = useState('');
  const speechRecognitionRef = useRef<any>(null);
  const recordedSpeechTextRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
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
          autoGainControl: true 
        } 
      });
      mediaStreamRef.current = stream;

      // Setup real-time audio FFT frequency visualizer
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

      // Setup SpeechRecognition for real-time live typing on Chrome
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
            if (cleaned) {
              recordedSpeechTextRef.current = cleaned;
              setLiveTranscript(cleaned);
              setVoiceTextInput(cleaned);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[STT] SpeechRecognition event:', event.error);
          };

          recognition.onend = () => {
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current) {
                  try { recognition.start(); } catch {}
                }
              }, 150);
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('[STT] SpeechRecognition init error:', e);
        }
      }

    } catch (err: any) {
      console.error('[STT] getUserMedia error:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      alert('Không thể truy cập microphone. Vui lòng cấp quyền micro trên trình duyệt của bạn.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
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
    if (currentText && currentText !== 'Đang lắng nghe câu trả lời của bạn...') {
      setLiveTranscript('');
      setVoiceTextInput('');
      setVoiceMessages(prev => [...prev, { role: 'user', content: currentText }]);
      sendVoiceMessage(currentText);
    } else {
      setLiveTranscript('');
    }
  }, [sendVoiceMessage, liveTranscript, voiceTextInput]);





  const handleEvaluateSession = async () => {
    setView('loading');
    setLoadingStepText('Đang nộp bài làm của bạn...');
    
    const steps = [
      'Đang nộp bài làm của bạn...',
      'AI đang phân tích toàn bộ câu trả lời...',
      'Đang chấm điểm và gán mã màu (Xanh/Vàng/Đỏ) cho các ý đúng/sai...',
      'Đang tổng hợp ưu điểm & các điểm cần cải thiện...',
      'Hoàn tất! Đang chuẩn bị chuyển hướng bạn đến trang kết quả chi tiết...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStepText(steps[stepIdx]);
      }
    }, 15000);

    try {
      const apiUrl = process.env.NODE_ENV === 'development'
        ? `http://localhost:8000/api/sessions/${sessionId}/evaluate`
        : `/api/sessions/${sessionId}/evaluate`;
        
      const res = await fetch(apiUrl, { method: 'POST' });
      if (res.ok) {
        clearInterval(interval);
        setLoadingStepText('Phân tích hoàn tất! Đang mở bảng điểm của bạn...');
        setTimeout(() => router.push(`/history/${sessionId}`), 1000);
      } else {
        alert("Lỗi khi chấm điểm! Vui lòng thử lại.");
        router.push(`/mocks`);
      }
    } catch (err) {
      alert("Lỗi kết nối khi chấm điểm! Vui lòng thử lại.");
      router.push(`/mocks`);
    }
  };

  const handleEndVoiceInterview = () => {
    ttsAbortRef.current?.abort();
    if (currentAudioRef.current) {
      try { currentAudioRef.current.pause(); } catch {}
    }
    if (recognitionRef.current) {
      const { stream, audioCtx, processor, ws } = recognitionRef.current;
      processor.disconnect();
      stream.getTracks().forEach((t: any) => t.stop());
      audioCtx.close();
      ws.close();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsAISpeaking(false);
    handleEvaluateSession();
  };

  // --- Text Handlers ---
  const handleSubmitTextAnswer = async () => {
    const currentQ = sessionQuestions[currentQuestionIndex];
    if (!currentQ) return;
    setLoadingStepText(`Đang lưu câu hỏi ${currentQuestionIndex + 1}...`);

    try {
      await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: currentQ.id, answer: userAnswerText })
      });
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswerText('');
    } else {
      handleEvaluateSession();
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-start w-full relative">
      <Navbar />
      <div className="pt-24 pb-8 flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
          
          {/* TEXT INTERVIEW VIEW */}
          {view === 'interview' && (
            <motion.div
              key="interview-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl px-6 flex flex-col gap-6"
            >
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

              <div className="bg-gradient-to-r from-blue-900/10 to-transparent border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 blur-xl rounded-full" />
                <h2 className="text-lg lg:text-xl font-bold leading-relaxed text-slate-800 dark:text-white relative z-10">
                  {sessionQuestions[currentQuestionIndex]?.questionText || sessionQuestions[currentQuestionIndex]?.text}
                </h2>
              </div>

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
                
                <div className="flex items-center justify-between text-xs text-slate-450 dark:text-slate-500 font-semibold px-2">
                  <span>💡 Tip: Giải thích chi tiết, thêm ví dụ cụ thể sẽ tăng điểm số đánh giá.</span>
                  <span>{userAnswerText.length} ký tự</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button 
                  onClick={() => {
                    setUserAnswerText('Tôi chưa có câu trả lời chi tiết cho phần này, xin phép bỏ qua.');
                    setTimeout(() => handleSubmitTextAnswer(), 50);
                  }}
                  className="px-6 py-3 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 font-bold rounded-2xl text-xs transition-all active:scale-95"
                >
                  Bỏ qua câu này
                </button>

                <button
                  onClick={handleSubmitTextAnswer}
                  disabled={!userAnswerText.trim()}
                  className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                >
                  {currentQuestionIndex === sessionQuestions.length - 1 ? 'Hoàn tất phỏng vấn ✨' : 'Nộp & Tiếp tục →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* VOICE READY — "Sẵn sàng?" screen */}
          {view === 'voice-ready' && (
            <motion.div
              key="voice-ready-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-lg w-full text-center space-y-8"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 border-2 border-blue-500/30">
                <Sparkles className="w-12 h-12 text-blue-200" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-white">Sẵn sàng phỏng vấn?</h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                  AI sẽ đặt câu hỏi và bạn trả lời bằng giọng nói. Hãy đảm bảo microphone hoạt động tốt.
                </p>
              </div>

              <button
                onClick={handleStartVoiceInterview}
                className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-full text-base transition-all shadow-xl shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Play className="w-5 h-5 fill-white/20" />
                Bắt đầu phỏng vấn
              </button>

              <p className="text-xs text-slate-500 font-medium">
                Nhấn nút để AI bắt đầu đặt câu hỏi
              </p>
            </motion.div>
          )}

          {/* VOICE INTERVIEW VIEW */}
          {view === 'voice-interview' && (
            <motion.div
              key="voice-interview-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0B1120] flex flex-col items-center overflow-y-auto"
            >
              <div className="text-center pt-14 pb-6 px-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 justify-center">
                  Mock Interview — Phiên âm thanh
                </h2>
                <p className="text-slate-400 mt-1.5 font-mono text-base">{formatTimer(interviewTimer)}</p>
              </div>

              <div className="bg-[#151E32] rounded-3xl border border-slate-700/50 shadow-2xl shadow-blue-500/5 px-14 py-10 flex gap-16 items-end mx-6">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-4xl shadow-inner border-2 transition-all duration-300 relative ${
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

                <div className="flex flex-col items-center gap-3">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative transition-all duration-300 border-2 border-blue-500/30 ${isAISpeaking ? 'ring-4 ring-blue-400/50 ring-offset-4 ring-offset-[#151E32]' : ''}`}>
                    {isAISpeaking && <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />}
                    <Sparkles className="w-10 h-10 text-blue-200 relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-200 text-sm">AI Interviewer</p>
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




              <div className="max-w-xl w-full px-6 mt-5 space-y-3">
                {/* AI Thinking indicator */}
                {isAIThinking ? (
                  <div className="bg-[#1a2540] rounded-2xl px-6 py-4 text-center flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : streamingAIText ? (
                  /* Streaming AI text */
                  <p className="bg-[#1a2540] border border-blue-500/20 rounded-2xl px-6 py-4 text-sm text-slate-200 text-center leading-relaxed">
                    {streamingAIText}
                    <span className="inline-block w-1.5 h-4 bg-blue-400 ml-1 animate-pulse rounded-sm align-middle" />
                  </p>
                ) : voiceMessages.length > 0 ? (
                  /* Last completed message */
                  <p className="bg-[#1a2540] border border-slate-700/30 rounded-2xl px-6 py-4 text-sm text-slate-200 text-center leading-relaxed">
                    {voiceMessages[voiceMessages.length - 1].content}
                  </p>
                ) : null}

                {/* Live transcript while recording */}
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
                    if (voiceTextInput.trim()) {
                      const text = voiceTextInput.trim();
                      if (isRecording) stopRecording();
                      setVoiceTextInput('');
                      setLiveTranscript('');
                      setVoiceMessages(prev => [...prev, { role: 'user', content: text }]);
                      sendVoiceMessage(text);
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

          {/* LOADING VIEW */}

          {view === 'loading' && (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-lg w-full text-center space-y-8"
            >
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="w-10 h-10 text-blue-400 relative z-10" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white">Đang xử lý</h3>
                <p className="text-sm text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                  {loadingStepText}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
