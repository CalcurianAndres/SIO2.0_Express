import {config} from 'dotenv'

config()

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SIO'

export const PORT_URI = process.env.PORT_URI || 3000

export const EXP = process.env.EXP || '2d'

export const SEED = process.env.SEED || 'Viva-Dios-la-Libertad-y-los-pueblos-libres'

export const TASA_API_URL = process.env.TASA_API_URL || 'https://ve.dolarapi.com/v1/dolares/oficial'

/**
 * Tasa de cambio (USD → VES) — integración con ExchangeRate-API.
 * Si TASA_API_URL está vacío se usa la API pública por defecto.
 */
export const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD'

/** TTL del cache en memoria para la tasa de cambio (1 hora por defecto). */
export const TASA_CACHE_TTL_MS = Number(process.env.TASA_CACHE_TTL_MS) || 60 * 60 * 1000

/** Umbral de fallos consecutivos para abrir el circuit breaker (15 min de pausa). */
export const TASA_CIRCUIT_BREAKER_MS = Number(process.env.TASA_CIRCUIT_BREAKER_MS) || 15 * 60 * 1000

export const TASA_CIRCUIT_BREAKER_THRESHOLD = Number(process.env.TASA_CIRCUIT_BREAKER_THRESHOLD) || 3
