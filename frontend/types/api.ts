export interface HighlightChunk {
  id?: string;
  text: string;
  type: 'normal' | 'success' | 'warning' | 'danger';
  popupTitle?: string;
  popupDesc?: string;
  statusText?: string;
}

export interface SessionQuestionResponse {
  id: number;
  text: string;
  tag: string;
  score: number;
  questionText: string;
  userAnswer: string;
  analysisChunks: HighlightChunk[];
  feedbackChunks: HighlightChunk[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MockSessionResponse {
  id: number;
  jobId: number;
  position: string;
  department: string;
  level: string;
  company: string;
  techStack: string[];
  status: string;
  date: string;
  questionsCount: number;
  score: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  aiOverallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  topicsToLearn: string[];
  resources: string[];
  questions?: SessionQuestionResponse[];
}

export interface JobResponse {
  id: number;
  title: string;
  company: string;
  category: string;
  level: string;
  department: string;
  techStack: string[];
  rounds: number;
  logo: string;
}
