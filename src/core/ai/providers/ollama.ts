import type { ChatRequest, ChatResponse, ChatMessage } from '../../types/ai';
import { BaseAIProvider } from './base';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

interface OllamaResponse {
  message?: { role: string; content: string };
  model?: string;
  eval_count?: number;
  prompt_eval_count?: number;
}

export class OllamaProvider extends BaseAIProvider {
  readonly name = 'Ollama';

  protected getEndpoint(): string {
    const base = this.baseUrl || DEFAULT_BASE_URL;
    return `${base.replace(/\/$/, '')}/api/chat`;
  }

  protected buildHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  }

  protected buildRequestBody(request: ChatRequest): unknown {
    return {
      model: request.model || this.model || DEFAULT_MODEL,
      stream: false,
      messages: request.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    };
  }

  protected parseResponse(body: unknown): ChatResponse {
    const res = body as OllamaResponse;
    return {
      content: res.message?.content ?? '',
      model: res.model || this.model || DEFAULT_MODEL,
      tokensUsed:
        res.prompt_eval_count != null || res.eval_count != null
          ? (res.prompt_eval_count ?? 0) + (res.eval_count ?? 0)
          : undefined,
    };
  }
}
