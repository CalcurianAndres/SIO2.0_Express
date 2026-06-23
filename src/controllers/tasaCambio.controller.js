import { obtenerTasaActual, guardarTasaManual } from '../services/tasaCambio.service';
import {
  TasaApiError,
  TasaValidationError,
  TasaCircuitOpenError,
} from '../services/tasaCambio.service';

/**
 * GET /api/tasa-cambio/actual
 * Devuelve la tasa actual USD→VES con metadatos de cache y fallback.
 */
export const getTasaActual = async (req, res) => {
  try {
    const data = await obtenerTasaActual();
    res.json({
      ok: true,
      tasa: data.tasa,
      fuente: data.fuente,
      fecha: data.fecha,
      cached: data.cached,
      manual: data.manual,
      fallback: data.fallback,
    });
  } catch (err) {
    if (err instanceof TasaCircuitOpenError) {
      return res.status(503).json({
        ok: false,
        err: { code: 'TASA_CIRCUIT_OPEN', message: 'Servicio de tasa temporalmente no disponible. Intente en unos minutos.' },
      });
    }
    if (err instanceof TasaValidationError) {
      return res.status(502).json({
        ok: false,
        err: { code: 'TASA_INVALID', message: 'La API externa devolvió datos inválidos.' },
      });
    }
    if (err instanceof TasaApiError) {
      return res.status(503).json({
        ok: false,
        err: { code: 'TASA_API_ERROR', message: 'No se pudo obtener la tasa automática. Ingrésela manualmente.' },
      });
    }
    res.status(500).json({ ok: false, err: { code: 'INTERNAL', message: 'Error interno al obtener la tasa.' } });
  }
};

/**
 * POST /api/tasa-cambio/manual
 * Body: { tasa: number }
 * Persiste una tasa manual y limpia el cache.
 */
export const postTasaManual = async (req, res) => {
  const { tasa } = req.body || {};
  const numeric = Number(tasa);
  try {
    const data = await guardarTasaManual(numeric, req.usuario?._id);
    res.json({ ok: true, ...data });
  } catch (err) {
    if (err instanceof TasaValidationError) {
      return res.status(400).json({ ok: false, err: { code: 'TASA_INVALID', message: err.message } });
    }
    res.status(500).json({ ok: false, err: { code: 'INTERNAL', message: 'No se pudo guardar la tasa manual.' } });
  }
};
