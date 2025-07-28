import { Router } from 'express'
import { detect, generate, jobDescription, transcribe } from '../controllers/openai.controller'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/generate', generate)
router.post('/detect', detect)
router.post('/job-description', jobDescription)
router.post('/transcribe', upload.single('file'), transcribe)

export default router