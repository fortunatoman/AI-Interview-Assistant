import type { Server, Socket } from 'socket.io'
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import { openaiService } from '../services/openai.service'
import { randomUUID } from 'node:crypto'

type DeepgramSession = {
    live: LiveClient
    isOpen: boolean
    keepAliveTimer?: NodeJS.Timeout
    reconnectAttempts: number
}

function coerceToArrayBuffer(data: unknown): ArrayBufferLike | null {
    try {
        if (!data) {
            logger.warn('Data is null or undefined')
            return null
        }

        if (Buffer.isBuffer(data)) {
            const buf = data as Buffer
            const result = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
            return result
        }

        if (data instanceof ArrayBuffer) {
            return data
        }

        if (ArrayBuffer.isView(data as ArrayBufferView)) {
            const view = data as ArrayBufferView
            const result = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBufferLike
            return result
        }

        if (typeof data === 'string') {
            // assume base64 string
            logger.debug({ stringLength: data.length }, 'Converting base64 string to ArrayBuffer')
            const buf = Buffer.from(data, 'base64')
            const result = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
            return result
        }

        logger.warn({ dataType: typeof data }, 'Unknown data type, cannot convert to ArrayBuffer')
        return null
    } catch (err) {
        logger.error({ err, dataType: typeof data }, 'Error coercing data to ArrayBuffer')
        return null
    }
}

function createDeepgramSession(socket: Socket, sessions: Map<string, DeepgramSession>): DeepgramSession | null {
    try {
        if (!env.DEEPGRAM_API_KEY) {
            socket.emit('deepgram:error', { message: 'Deepgram not configured' })
            return null
        }

        const dg = createClient(env.DEEPGRAM_API_KEY)
        const live: LiveClient = dg.listen.live({
            model: env.DEEPGRAM_MODEL,
            // Basic audio configuration - let Deepgram auto-detect
            interim_results: true,
            punctuate: true,
            smart_format: true,
            language: env.DEEPGRAM_LANGUAGE,
            endpointing: env.DEEPGRAM_ENDPOINTING,
        } as any)

        const session: DeepgramSession = {
            live,
            isOpen: false,
            reconnectAttempts: 0
        }

        // Start keep-alive timer to prevent session timeout
        const startKeepAlive = () => {
            if (session.keepAliveTimer) clearInterval(session.keepAliveTimer)
            session.keepAliveTimer = setInterval(() => {
                if (session.isOpen) {
                    try {
                        // Send empty audio chunk to keep session alive
                        const emptyBuffer = new ArrayBuffer(0)
                        session.live.send(emptyBuffer)
                    } catch (err) {
                        logger.debug({ err }, 'Keep-alive send failed')
                    }
                }
            }, 3000) // Every 3 seconds (more frequent)
        }

        live.on(LiveTranscriptionEvents.Open, () => {
            session.isOpen = true
            session.reconnectAttempts = 0 // Reset reconnect attempts on successful open
            logger.info({ socketId: socket.id }, 'Deepgram session opened')
            socket.emit('deepgram:open')
            startKeepAlive()
        })

        live.on(LiveTranscriptionEvents.Transcript, async (evt: any) => {
            try {
                const alternative = evt?.channel?.alternatives?.[0]
                const text: string = alternative?.transcript || ''
                const isFinal: boolean = !!evt?.is_final

                if (text) {
                    socket.emit('deepgram:transcript', { text, isFinal })
                    if (isFinal) {
                        try {
                            const detection = await openaiService.detectQuestionAndAnswer(text)
                            if (detection.isQuestion && detection.question) {
                                const id = randomUUID()
                                socket.emit('detect:question', { id, question: detection.question, source: 'speech' })
                            }
                        } catch (err: any) {
                            logger.warn({ err }, 'openai detect failed for deepgram transcript')
                        }
                    }
                } else {
                    logger.warn({ socketId: socket.id, event: evt }, 'Empty transcript received from Deepgram')
                }
            } catch (err) {
                logger.error({ err }, 'deepgram transcript handler error')
            }
        })

        live.on(LiveTranscriptionEvents.Error, (err: any) => {
            logger.error({ err, socketId: socket.id }, 'Deepgram error')
            socket.emit('deepgram:error', { message: err?.message || 'Deepgram error' })
        })

        live.on(LiveTranscriptionEvents.Close, () => {
            logger.info({ socketId: socket.id }, 'Deepgram session closed')
            if (session.keepAliveTimer) clearInterval(session.keepAliveTimer)

            // Don't remove session immediately - try to reconnect
            session.isOpen = false

            // Attempt to reconnect if socket is still connected
            if (socket.connected && session.reconnectAttempts < 3) {
                session.reconnectAttempts++
                logger.info({ socketId: socket.id, attempt: session.reconnectAttempts }, 'Attempting to reconnect Deepgram session')

                setTimeout(() => {
                    if (socket.connected) {
                        try {
                            // Create new live client
                            const dg = createClient(env.DEEPGRAM_API_KEY)
                            const newLive: LiveClient = dg.listen.live({
                                model: env.DEEPGRAM_MODEL,
                                // Basic audio configuration - let Deepgram auto-detect
                                interim_results: true,
                                punctuate: true,
                                smart_format: true,
                                language: env.DEEPGRAM_LANGUAGE,
                                endpointing: env.DEEPGRAM_ENDPOINTING,
                            } as any)

                            // Replace the old live client
                            session.live = newLive

                            // Re-attach event handlers
                            newLive.on(LiveTranscriptionEvents.Open, () => {
                                session.isOpen = true
                                session.reconnectAttempts = 0
                                logger.info({ socketId: socket.id }, 'Deepgram session reconnected')
                                socket.emit('deepgram:open')
                                startKeepAlive()
                            })

                            newLive.on(LiveTranscriptionEvents.Transcript, async (evt: any) => {
                                try {
                                    const alternative = evt?.channel?.alternatives?.[0]
                                    const text: string = alternative?.transcript || ''
                                    const isFinal: boolean = !!evt?.is_final
                                    if (text) {
                                        socket.emit('deepgram:transcript', { text, isFinal })
                                        if (isFinal) {
                                            try {
                                                const detection = await openaiService.detectQuestionAndAnswer(text)
                                                if (detection.isQuestion && detection.question) {
                                                    const id = randomUUID()
                                                    socket.emit('detect:question', { id, question: detection.question, source: 'speech' })
                                                }
                                            } catch (err: any) {
                                                logger.warn({ err }, 'openai detect failed for deepgram transcript')
                                            }
                                        }
                                    }
                                } catch (err) {
                                    logger.error({ err }, 'deepgram transcript handler error')
                                }
                            })

                            newLive.on(LiveTranscriptionEvents.Error, (err: any) => {
                                logger.error({ err, socketId: socket.id }, 'Deepgram reconnection error')
                                socket.emit('deepgram:error', { message: err?.message || 'Deepgram error' })
                            })

                            newLive.on(LiveTranscriptionEvents.Close, () => {
                                logger.info({ socketId: socket.id }, 'Deepgram reconnected session closed')
                                if (session.keepAliveTimer) clearInterval(session.keepAliveTimer)
                                session.isOpen = false
                            })

                        } catch (err: any) {
                            logger.error({ err, socketId: socket.id }, 'Failed to reconnect Deepgram session')
                        }
                    }
                }, 1000) // Wait 1 second before reconnecting
            } else {
                // Max reconnection attempts reached or socket disconnected
                if (session.reconnectAttempts >= 3) {
                    logger.warn({ socketId: socket.id }, 'Max Deepgram reconnection attempts reached')
                }
                sessions.delete(socket.id)
                socket.emit('deepgram:closed')
            }
        })

        return session
    } catch (err: any) {
        logger.error({ err, socketId: socket.id }, 'Failed to create Deepgram session')
        socket.emit('deepgram:error', { message: err?.message || 'failed to start deepgram' })
        return null
    }
}

export function registerDeepgramSocket(io: Server) {
    const sessions: Map<string, DeepgramSession> = new Map()

    io.on('connection', (socket: Socket) => {
        // Automatically start Deepgram when socket connects
        const session = createDeepgramSession(socket, sessions)
        if (session) {
            sessions.set(socket.id, session)
        }

        // Handle incoming audio chunks
        socket.on('deepgram:audio', (chunk: unknown) => {
            const session = sessions.get(socket.id)
            if (!session || !session.isOpen) {
                logger.debug({ socketId: socket.id, hasSession: !!session, isOpen: session?.isOpen }, 'Ignoring audio chunk - session not ready')
                return
            }

            try {
                const ab = coerceToArrayBuffer(chunk)
                if (ab && ab.byteLength > 0) {
                    session.live.send(ab)
                } else {
                    logger.warn({
                        socketId: socket.id,
                        chunkType: typeof chunk,
                        abExists: !!ab,
                        abByteLength: ab?.byteLength
                    }, 'Invalid audio chunk - empty or null')
                }
            } catch (err) {
                logger.error({ err, socketId: socket.id, chunkType: typeof chunk }, 'Failed to send audio chunk to Deepgram')
            }
        })

        // Handle disconnect - clean up session
        socket.on('disconnect', () => {
            const session = sessions.get(socket.id)
            if (session) {
                logger.info({ socketId: socket.id }, 'Socket disconnected, cleaning up Deepgram session')
                if (session.keepAliveTimer) clearInterval(session.keepAliveTimer)
                try {
                    session.live.finish?.()
                } catch (err) {
                    logger.debug({ err }, 'Error finishing Deepgram session')
                }
                sessions.delete(socket.id)
            }
        })
    })
}


