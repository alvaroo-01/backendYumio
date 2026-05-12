import 'dotenv/config'
import app from './app.js'
import { testConnection } from './config/db.js'

const PORT = process.env.PORT || 3000

async function bootstrap() {
  try {
    await testConnection()
    console.log('✅  Conexión a MySQL establecida.')

    app.listen(PORT, () => {
      console.log(`🚀  Servidor escuchando en http://localhost:${PORT}`)
      console.log(`    Entorno: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    console.error('❌  No se pudo conectar a la base de datos:', err.message)
    process.exit(1)
  }
}

bootstrap()

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido')
  process.exit(0)
})