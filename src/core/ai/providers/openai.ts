import type { ChatRequest, ChatResponse, ChatMessage } from '../../types/ai';
import { BaseAIProvider } from './base';

const DEFAULT_BASE_URL = 'https://api.openai.com';
const DEFAULT_MODEL = 'gpt-4o-mini';

interface OpenAIChoice {
  message: { role: string; content: string };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'OpenAI';

  protected getEndpoint(): string {
    const base = this.baseUrl || DEFAULT_BASE_URL;
    return `${base.replace(/\/$/, '')}/v1/chat/completions`;
  }

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  protected buildRequestBody(request: ChatRequest): unknown {
    return {
      model: request.model || this.model || DEFAULT_MODEL,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.3,
      messages: request.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    };
  }

  protected parseResponse(body: unknown): ChatResponse {
    const res = body as OpenAIResponse;
    const text = res.choices?.[0]?.message?.content ?? '';

    return {
      content: text,
      model: res.model || this.model || DEFAULT_MODEL,
      tokensUsed: res.usage ? res.usage.prompt_tokens + res.usage.completion_tokens : undefined,
    };
  }
}
