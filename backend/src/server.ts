import 'dotenv/config'
import http from 'http'
import { AddressInfo } from 'net'
import { Server as IOServer } from 'socket.io'
import { createApp } from './app'
import { env } from './config/env'
import { logger } from './utils/logger'
import { registerOpenAISocket } from './sockets/openai.socket'
import { registerDeepgramSocket } from './sockets/deepgram.socket'

const app = createApp()
const server = http.createServer(app)

const io = new IOServer(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin
            if (!origin) return callback(null, true)

            // Allow all origins by returning the specific origin
            callback(null, origin)
        },
    },
})

io.on('connection', (socket: any) => {
    logger.info({ id: socket.id }, 'socket connected')
    socket.on('disconnect', (reason: any) => {
        logger.info({ id: socket.id, reason }, 'socket disconnected')
    })
})

registerDeepgramSocket(io)
registerOpenAISocket(io)

const listener = server.listen(env.PORT || 3000, () => {
    const { port } = listener.address() as AddressInfo
    logger.info({ port, env: env.NODE_ENV }, `HTTP server listening on :${port}`)
})

const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down')
    io.close(() => {
        server.close(() => {
            logger.info('closed')
            process.exit(0)
        })
    })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))


