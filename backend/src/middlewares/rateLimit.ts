import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})


