export function ok(res, data = {}, status = 200) {
  return res.status(status).json({ ok: true, ...data })
}

export function created(res, data = {}) {
  return ok(res, data, 201)
}

export function noContent(res) {
  return res.status(204).send()
}

export function badRequest(res, message = 'Solicitud incorrecta.', errors = null) {
  const body = { ok: false, message }
  if (errors) body.errors = errors
  return res.status(400).json(body)
}

export function unauthorized(res, message = 'No autenticado.') {
  return res.status(401).json({ ok: false, message })
}

export function forbidden(res, message = 'No tienes permiso para realizar esta acción.') {
  return res.status(403).json({ ok: false, message })
}

export function notFound(res, message = 'Recurso no encontrado.') {
  return res.status(404).json({ ok: false, message })
}

export function conflict(res, message = 'Conflicto con el estado actual del recurso.') {
  return res.status(409).json({ ok: false, message })
}

export function serverError(res, message = 'Error interno del servidor.') {
  return res.status(500).json({ ok: false, message })
}
