import { Router } from 'express'
import { getCatalogs } from '../controllers/catalog.controller.js'

const router = Router()

// Ruta pública: el frontend la necesita antes de que el usuario inicie sesión
router.get('/', getCatalogs)

export default router
