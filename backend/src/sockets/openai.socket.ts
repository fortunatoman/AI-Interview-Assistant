import type { Server, Socket } from 'socket.io'
import { openaiService, type ChatContext } from '../services/openai.service'
import { randomUUID } from 'node:crypto'

export function registerOpenAISocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        // Detection: FE sends an utterance, BE detects and proactively emits detected question
        socket.on('openai:detect:utterance', async (payload: { utterance: string; context?: ChatContext; source?: 'typed' | 'speech' }) => {
            try {
                const { utterance, context, source } = payload || ({} as any)
                if (!utterance) return
                const result = await openaiService.detectQuestionAndAnswer(utterance, context)
                if (result.isQuestion && result.question) {
                    const detectedId = randomUUID()
                    socket.emit('detect:question', { id: detectedId, question: result.question, source: source || 'typed' })
                }
            } catch (err: any) {
                socket.emit('detect:error', { message: err?.message || 'detect error' })
            }
        })
        socket.on('openai:chat:start', async (payload: { detectedId?: string; question: string; context?: ChatContext }) => {
            try {
                const { question, context } = payload || ({} as any)
                for await (const delta of openaiService.streamChat(question, context)) {
                    socket.emit('openai:chat:delta', delta)
                }
                socket.emit('openai:chat:done')
            } catch (err: any) {
                socket.emit('openai:chat:error', { message: err?.message || 'stream error' })
            }
        })
    })
}


