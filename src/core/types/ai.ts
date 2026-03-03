export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}

export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  category: string;
  estimatedImpact: number;
  urgency: 'high' | 'medium' | 'low';
}

export interface AIAdvice {
  summary: string;
  recommendations: AIRecommendation[];
}

export interface AIInsightsReport {
  noShowAdvice: AIAdvice;
  utilizationAdvice: AIAdvice;
  revenueAdvice: AIAdvice;
  actionPlan: AIAdvice;
  generatedAt: Date;
}
