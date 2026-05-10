import { validationResult } from 'express-validator'
import { badRequest } from '../utils/response.js'

export function validate(req, res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }))
    return badRequest(res, 'Revisa los campos del formulario.', errors)
  }
  next()
}
