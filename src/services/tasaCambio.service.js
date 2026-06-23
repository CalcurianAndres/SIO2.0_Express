import axios from 'axios';
import Tasa from '../models/tasa';
import {
  EXCHANGE_RATE_API_URL,
  TASA_CACHE_TTL_MS,
  TASA_CIRCUIT_BREAKER_MS,
  TASA_CIRCUIT_BREAKER_THRESHOLD,
} from '../config';

/**
 * Errores tipados para la integración de tasa de cambio.
 */
export class TasaApiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'TasaApiError';
    this.cause = cause;
  }
}
export class TasaValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TasaValidationError';
  }
}
export class TasaCircuitOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TasaCircuitOpenError';
  }
}

/**
 * Servicio de tasa de cambio USD → VES (BCV).
 *
 * Fuente: pydolarve.com (réplica pública de la tasa oficial del BCV).
 * Si pydolarve falla → fallback a ExchangeRate-API.
 * Cache en memoria: 1 hora.
 * Circuit breaker: 3 fallos consecutivos → pausa 15 min.
 */
class TasaCambioService {
  constructor() {
    this.cache = { value: null, timestamp: 0 };
    this.failures = 0;
    this.circuitOpenUntil = 0;
  }

  isCacheFresh() {
    return this.cache.value !== null && Date.now() - this.cache.timestamp < TASA_CACHE_TTL_MS;
  }

  clearCache() {
    this.cache = { value: null, timestamp: 0 };
  }

  isCircuitOpen() {
    if (this.failures < TASA_CIRCUIT_BREAKER_THRESHOLD) return false;
    if (Date.now() >= this.circuitOpenUntil) {
      this.failures = 0;
      this.circuitOpenUntil = 0;
      return false;
    }
    return true;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= TASA_CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpenUntil = Date.now() + TASA_CIRCUIT_BREAKER_MS;
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.circuitOpenUntil = 0;
  }

  /**
   * Intenta obtener la tasa oficial (BCV) vía ve.dolarapi.com.
   * Endpoint: https://ve.dolarapi.com/v1/dolares/oficial
   * Respuesta: { fuente: "oficial", promedio: <número>, fechaActualizacion: ISO }
   */
  async fetchFromBcv() {
    if (this.isCircuitOpen()) {
      throw new TasaCircuitOpenError('Servicio de tasa BCV temporalmente deshabilitado');
    }

    try {
      const { data } = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial', {
        timeout: 5000,
        headers: { Accept: 'application/json' },
      });

      // dolarapi: data.promedio o data.venta
      const price = data?.promedio ?? data?.venta;
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        throw new TasaValidationError('dolarapi no devolvió una tasa oficial válida');
      }
      this.recordSuccess();
      return price;
    } catch (err) {
      if (err instanceof TasaValidationError) throw err;
      throw new TasaApiError(`Error al consultar BCV: ${err.message}`, err);
    }
  }

  /**
   * Fallback: ExchangeRate-API (USD → VES).
   */
  async fetchFromExchangeRateApi() {
    try {
      const { data } = await axios.get(EXCHANGE_RATE_API_URL, { timeout: 5000 });
      const ves = data?.rates?.VES;
      if (typeof ves !== 'number' || !Number.isFinite(ves) || ves <= 0) {
        throw new TasaValidationError('ExchangeRate-API no devolvió tasa VES válida');
      }
      return ves;
    } catch (err) {
      if (err instanceof TasaValidationError) throw err;
      throw new TasaApiError(`Error en fallback: ${err.message}`, err);
    }
  }

  async findLastPersisted() {
    try {
      const last = await Tasa.findOne().sort({ fecha: -1 }).lean();
      if (!last) return null;
      return { tasa: last.tasa, fuente: last.fuente, fecha: last.fecha };
    } catch (err) {
      return null;
    }
  }

  /**
   * Pipeline principal: cache → DB → BCV → fallback → última conocida.
   */
  async getTasaActual() {
    // 1) Cache en memoria
    if (this.isCacheFresh()) {
      return {
        tasa: this.cache.value.tasa,
        fuente: this.cache.value.fuente,
        fecha: this.cache.value.fecha,
        cached: true,
        manual: this.cache.value.fuente === 'manual',
        fallback: false,
      };
    }

    // 2) DB: última del día
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    const persistedToday = await Tasa.findOne({
      fecha: { $gte: start, $lte: end },
    }).sort({ fecha: -1 }).lean();

    if (persistedToday) {
      this.cache = { value: persistedToday, timestamp: Date.now() };
      return {
        tasa: persistedToday.tasa,
        fuente: persistedToday.fuente,
        fecha: persistedToday.fecha,
        cached: false,
        manual: persistedToday.fuente === 'manual',
        fallback: false,
      };
    }

    // 3) BCV
    let rate = null;
    let bcvError = null;
    try {
      rate = await this.fetchFromBcv();
    } catch (err) {
      bcvError = err;
      this.recordFailure();
    }

    // 4) Fallback ExchangeRate-API
    if (rate === null) {
      try {
        rate = await this.fetchFromExchangeRateApi();
      } catch (err) {
        // 5) Última conocida en DB
        const last = await this.findLastPersisted();
        if (last) {
          this.cache = { value: last, timestamp: Date.now() };
          return {
            tasa: last.tasa,
            fuente: last.fuente,
            fecha: last.fecha,
            cached: false,
            manual: last.fuente === 'manual',
            fallback: true,
          };
        }
        throw bcvError || err;
      }
    }

    // 6) Persistir y cachear
    const nueva = await Tasa.create({ tasa: rate, fuente: 'api' });
    this.cache = { value: { tasa: nueva.tasa, fuente: nueva.fuente, fecha: nueva.fecha }, timestamp: Date.now() };
    return {
      tasa: nueva.tasa,
      fuente: 'api',
      fecha: nueva.fecha,
      cached: false,
      manual: false,
      fallback: false,
    };
  }

  async guardarTasaManual(tasa, usuarioId = null) {
    if (typeof tasa !== 'number' || !Number.isFinite(tasa) || tasa <= 0) {
      throw new TasaValidationError('La tasa debe ser un número mayor a cero');
    }
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);

    const existing = await Tasa.findOneAndUpdate(
      { fecha: { $gte: start, $lte: end }, fuente: 'manual' },
      { $set: { tasa, fecha: new Date(), ...(usuarioId ? { usuario: usuarioId } : {}) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    this.clearCache();
    return {
      tasa: existing.tasa,
      fuente: existing.fuente,
      fecha: existing.fecha,
      manual: true,
    };
  }
}

const instance = new TasaCambioService();

export const obtenerTasaActual = () => instance.getTasaActual();
export const guardarTasaManual = (tasa, usuarioId) => instance.guardarTasaManual(tasa, usuarioId);
export const clearCache = () => instance.clearCache();
export default instance;
