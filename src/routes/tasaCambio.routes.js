const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verificarToken = require('../Auth/autenticacion');
const { getTasaActual, postTasaManual } = require('../controllers/tasaCambio.controller');

// Rate limiter: 30 req/min por IP para evitar abuso del endpoint.
const tasaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, err: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes, intente en un minuto.' } },
});

router.use(verificarToken);
router.use(tasaLimiter);

router.get('/actual', getTasaActual);
router.post('/manual', postTasaManual);

module.exports = router;
