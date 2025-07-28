import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { openaiService } from '../services/openai.service'
import type { Request as ExpressRequest } from 'express'

const generateSchema = z.object({
    question: z.string().min(1),
    context: z
        .object({
            resume: z.string().optional(),
            jobDescription: z.string().optional(),
            additionalContext: z.string().optional(),
        })
        .optional(),
})

export async function generate(req: Request, res: Response, next: NextFunction) {
    try {
        const { question, context } = generateSchema.parse(req.body)
        const text = await openaiService.generateInterviewResponse(question, context)
        res.json({ ok: true, text })
    } catch (err) {
        next(err)
    }
}

const detectSchema = z.object({
    utterance: z.string().min(1),
    context: z
        .object({
            resume: z.string().optional(),
            jobDescription: z.string().optional(),
            additionalContext: z.string().optional(),
        })
        .optional(),
})

export async function detect(req: Request, res: Response, next: NextFunction) {
    try {
        const { utterance, context } = detectSchema.parse(req.body)
        const result = await openaiService.detectQuestionAndAnswer(utterance, context)
        res.json({ ok: true, ...result })
    } catch (err) {
        next(err)
    }
}

const jobDescSchema = z.object({
    jobTitle: z.string().min(1),
    industry: z.string().optional(),
    companyName: z.string().optional(),
    companySize: z.string().optional(),
    experienceLevel: z.string().optional(),
    keySkills: z.array(z.string()).optional(),
})

export async function jobDescription(req: Request, res: Response, next: NextFunction) {
    try {
        const params = jobDescSchema.parse(req.body)
        const text = await openaiService.generateJobDescription(params)
        res.json({ ok: true, text })
    } catch (err) {
        next(err)
    }
}

export async function transcribe(req: ExpressRequest, res: Response, next: NextFunction) {
    try {
        const file = (req as any).file as { buffer: Buffer; mimetype?: string } | undefined
        if (!file || !file.buffer) {
            res.status(400).json({ ok: false, error: 'file is required' })
            return
        }
        const text = await openaiService.transcribeAudioBuffer(file.buffer, file.mimetype || 'application/octet-stream')
        res.json({ ok: true, text })
    } catch (err) {
        next(err)
    }
}


