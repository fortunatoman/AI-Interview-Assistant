import { Router } from 'express'
import multer from 'multer'
import { extractText } from '../controllers/files.controller'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/extract-text', upload.single('file'), extractText)

export default router


