import type { Request, Response, NextFunction } from 'express'
import pdfParse from 'pdf-parse'

export async function extractText(req: Request, res: Response, next: NextFunction) {
    try {
        const file = (req as any).file as { buffer: Buffer; mimetype?: string; originalname?: string } | undefined
        if (!file || !file.buffer) {
            res.status(400).json({ ok: false, error: 'file is required' })
            return
        }
        if (!(file.mimetype?.includes('pdf') || (file.originalname || '').toLowerCase().endsWith('.pdf'))) {
            res.status(400).json({ ok: false, error: 'only PDF files are supported' })
            return
        }
        const data = await pdfParse(file.buffer)
        const text = (data as any)?.text || ''
        res.json({ ok: true, text })
    } catch (err) {
        next(err)
    }
}


