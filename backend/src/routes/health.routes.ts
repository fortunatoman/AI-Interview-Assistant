import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'backend', status: 'healthy' })
})

export default router