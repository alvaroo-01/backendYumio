import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

// process.cwd() apunta siempre al directorio desde el que se ejecuta `node` (la raíz del proyecto).
// Es más robusto que __dirname cuando el proceso se inicia desde distintos CWDs.
const projectRoot = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : process.cwd()

export const uploadsDir = path.resolve(projectRoot, process.env.UPLOADS_DIR || 'uploads')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowed.includes(file.mimetype)) return cb(null, true)
  cb(new Error('Solo se permiten imágenes (jpeg, png, webp, gif)'), false)
}

const maxSizeMB = Number(process.env.MAX_FILE_SIZE_MB) || 5

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
})
