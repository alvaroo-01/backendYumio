import { serverError } from '../utils/response.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err)

  // Errores de Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ ok: false, message: 'El archivo supera el tamaño máximo permitido.' })
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ ok: false, message: err.message })
  }

  return serverError(res)
}
