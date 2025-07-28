import { api } from './backend'
import { getSocket } from './backend'

class OpenAIService {
    isConfigured(): boolean {
        return true;
    }

    async generateInterviewResponse(
        question: string,
        context?: { resume?: string; jobDescription?: string; additionalContext?: string }
    ): Promise<string> {
        const resp = await api.post('/api/openai/generate', { question, context });
        const text = resp.data?.text || '';
        if (!text) throw new Error('No response generated from server');
        return text;
    }

    async generateJobDescription(
        jobTitle: string,
        industry?: string,
        companyName?: string,
        experienceLevel?: string,
        keySkills?: string[]
    ): Promise<string> {
        const resp = await api.post('/api/openai/generate', { jobTitle, industry, companyName, experienceLevel, keySkills });
        const text = resp.data?.text || '';
        if (!text) throw new Error('No response generated from server');
        return text;
    }

    async detectQuestionAndAnswer(
        utterance: string,
        context?: { resume?: string; jobDescription?: string; additionalContext?: string }
    ): Promise<{ isQuestion: boolean; question: string | null; answer: string | null }> {
        const resp = await api.post('/api/openai/detect', { utterance, context });
        const { isQuestion, question, answer } = resp.data || {};
        return { isQuestion: !!isQuestion, question: question ?? null, answer: answer ?? null };
    }

    async generateFollowUpQuestions(originalQuestion: string, response: string): Promise<string[]> {
        const meta = `Based on this interview question and response, suggest 2-3 relevant follow-up questions. One per line.`;
        const combined = `${meta}\n\nOriginal Question: ${originalQuestion}\nResponse: ${response}`;
        const text = await this.generateInterviewResponse(combined);
        return text.split('\n').map((s) => s.trim()).filter(Boolean);
    }

    async streamAnswer(params: {
        question: string;
        context?: { resume?: string; jobDescription?: string; additionalContext?: string };
        onDelta: (delta: string) => void;
        onDone?: () => void;
        onError?: (message: string) => void;
    }): Promise<() => void> {
        const socket = getSocket();
        const handleDelta = (d: string) => params.onDelta(d || '');
        const handleDone = () => params.onDone?.();
        const handleError = (e: any) => params.onError?.(e?.message || 'stream error');
        socket.on('openai:chat:delta', handleDelta);
        socket.on('openai:chat:done', handleDone);
        socket.on('openai:chat:error', handleError);
        socket.emit('openai:chat:start', { question: params.question, context: params.context });
        return () => {
            try {
                socket.off('openai:chat:delta', handleDelta);
                socket.off('openai:chat:done', handleDone);
                socket.off('openai:chat:error', handleError);
            } catch { }
        };
    }

    getUsageInfo(): { configured: boolean; model: string; maxTokens: number; source: string } {
        return { configured: true, model: 'server', maxTokens: 0, source: 'backend' };
    }
}

export const openaiService = new OpenAIService();
export default openaiService;