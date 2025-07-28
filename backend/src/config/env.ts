import { z } from 'zod'

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z
        .string()
        .default(process.env.PORT ?? '3000')
        .transform((v: string) => Number(v))
        .pipe(z.number().int().positive()),
    ALLOWED_ORIGINS: z
        .string()
        .default('*') // Allow all origins by default
        .transform((v: string) => v.split(',').map((o: string) => o.trim()).filter(Boolean)),
    // Placeholders for later secrets (not required yet)
    OPENAI_API_KEY: z.string().optional(),
    DEEPGRAM_API_KEY: z.string().optional(),
    DEEPGRAM_MODEL: z.string().default('nova-3'),
    DEEPGRAM_INTERIM_RESULTS: z.boolean().default(true),
    DEEPGRAM_SMART_FORMAT: z.boolean().default(true),
    DEEPGRAM_PUNCTUATE: z.boolean().default(true),
    DEEPGRAM_LANGUAGE: z.string().default('en-US'),
    DEEPGRAM_ENDPOINTING: z.number().default(500),
})

export const env = EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    DEEPGRAM_MODEL: process.env.DEEPGRAM_MODEL,
    DEEPGRAM_INTERIM_RESULTS: process.env.DEEPGRAM_INTERIM_RESULTS,
    DEEPGRAM_SMART_FORMAT: process.env.DEEPGRAM_SMART_FORMAT,
    DEEPGRAM_PUNCTUATE: process.env.DEEPGRAM_PUNCTUATE,
    DEEPGRAM_LANGUAGE: process.env.DEEPGRAM_LANGUAGE,
    DEEPGRAM_ENDPOINTING: process.env.DEEPGRAM_ENDPOINTING,
})


