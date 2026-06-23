import https from 'https';
import Tasa from '../models/tasa';
import { TASA_API_URL } from '../config';

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const fetchExternalRate = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (err) {
            reject(new Error('La respuesta de la API no es JSON válido'));
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const extractRate = (payload) => {
  if (payload === null || payload === undefined) return null;

  if (typeof payload === 'number' && payload > 0) return payload;

  const keys = ['tasa', 'rate', 'precio', 'price', 'valor', 'value', 'USD', 'usd', 'promedio'];
  for (const key of keys) {
    if (typeof payload[key] === 'number' && payload[key] > 0) {
      return payload[key];
    }
    if (typeof payload[key] === 'string') {
      const parsed = parseFloat(payload[key].replace(/[^0-9.]/g, ''));
      if (parsed > 0) return parsed;
    }
  }

  for (const key in payload) {
    const child = payload[key];
    if (child && typeof child === 'object') {
      for (const inner of keys) {
        if (typeof child[inner] === 'number' && child[inner] > 0) {
          return child[inner];
        }
        if (typeof child[inner] === 'string') {
          const parsed = parseFloat(child[inner].replace(/[^0-9.]/g, ''));
          if (parsed > 0) return parsed;
        }
      }
    }
  }

  return null;
};

export const obtenerTasaActual = async () => {
  try {
    const today = new Date();

    // 1) SIEMPRE intentar la API primero para tener la tasa más reciente del día.
    if (TASA_API_URL) {
      try {
        const payload = await fetchExternalRate(TASA_API_URL);
        const rate = extractRate(payload);

        if (rate) {
          // Si la tasa de la API difiere de la última guardada, actualizar.
          const ultima = await Tasa.findOne({ fuente: 'api' }).sort({ fecha: -1 });
          if (!ultima || ultima.tasa !== rate) {
            const nuevaTasa = new Tasa({ tasa: rate, fuente: 'api' });
            await nuevaTasa.save();
            console.log(`✅ Tasa actualizada desde API: ${rate}`);
          }
          return {
            tasa: rate,
            fuente: 'api',
            fecha: new Date(),
            manual: false,
          };
        }
      } catch (apiErr) {
        console.warn('⚠️ No se pudo obtener tasa de la API, usando fallback DB:', apiErr.message);
      }
    }

    // 2) Fallback: buscar la última tasa guardada (manual o api) en DB.
    const ultimaGuardada = await Tasa.findOne().sort({ fecha: -1 });
    if (ultimaGuardada) {
      return {
        tasa: ultimaGuardada.tasa,
        fuente: ultimaGuardada.fuente,
        fecha: ultimaGuardada.fecha,
        manual: ultimaGuardada.fuente === 'manual',
      };
    }

    // 3) Sin datos: devolver null para input manual.
    return { tasa: null, fuente: null, fecha: null, manual: true };
  } catch (err) {
    console.warn('⚠️ Error al obtener tasa actual:', err.message);
    return { tasa: null, fuente: null, fecha: null, manual: true };
  }
};

export const guardarTasaManual = async (tasa) => {
  if (typeof tasa !== 'number' || tasa <= 0) {
    throw new Error('La tasa debe ser un número mayor a cero');
  }

  const today = new Date();
  const existing = await Tasa.findOne({
    fecha: { $gte: startOfDay(today), $lte: endOfDay(today) },
    fuente: 'manual',
  });

  if (existing) {
    existing.tasa = tasa;
    existing.fecha = new Date();
    await existing.save();
    return {
      tasa: existing.tasa,
      fuente: existing.fuente,
      fecha: existing.fecha,
      manual: true,
    };
  }

  const nuevaTasa = new Tasa({ tasa, fuente: 'manual' });
  await nuevaTasa.save();
  return {
    tasa: nuevaTasa.tasa,
    fuente: nuevaTasa.fuente,
    fecha: nuevaTasa.fecha,
    manual: true,
  };
};
