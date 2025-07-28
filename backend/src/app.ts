import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import pinoHttp from 'pino-http'
import morgan from 'morgan'
import { env } from './config/env'
import { rateLimiter } from './middlewares/rateLimit'
import { errorHandler } from './middlewares/error'
import { logger } from './utils/logger'
import healthRouter from './routes/health.routes'
import openaiRouter from './routes/openai.routes'
import filesRouter from './routes/files.routes'

export function createApp() {
    const app = express()

    app.disable('x-powered-by')

    app.use(
        cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true)

                // Allow all origins when credentials are not required
                // For credentials mode, we need to return the specific origin
                callback(null, origin)
            },
            // credentials option removed: cross-origin requests will not include credentials (cookies, authorization headers, etc.)
        })
    )
    app.use(helmet())
    app.use(compression())

    app.use(express.json({ limit: '2mb' }))
    app.use(express.urlencoded({ extended: true }))

    app.use(pinoHttp({ logger }))

    // HTTP request logging with Morgan
    app.use(morgan('combined'))

    app.use('/health', healthRouter)
    app.use('/api/openai', openaiRouter)
    app.use('/api/files', filesRouter)

    app.use(rateLimiter)

    // 404 handler
    app.use((req: express.Request, res: express.Response) => {
        res.status(404).json({ ok: false, error: 'Not Found' })
    })

    app.use(errorHandler)

    return app
}


