const express = require('express');
const router = express.Router();
const Pantone = require('../models/pantone').default;

// GET /api/pantones - Listar todos los Pantones
router.get('/', async (req, res) => {
  try {
    const pantones = await Pantone.find().sort({ code: 1 });
    res.json(pantones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener Pantones', detail: err.message });
  }
});

// GET /api/pantones/search?q= - Búsqueda por código o HEX
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    // Si no hay query, retornar todos
    if (!query || query.trim() === '') {
      const pantones = await Pantone.find().sort({ code: 1 });
      return res.json(pantones);
    }

    // Búsqueda regex case-insensitive en code y hex
    const regex = new RegExp(query, 'i');
    const pantones = await Pantone.find({
      $or: [
        { code: regex },
        { hex: regex }
      ]
    }).sort({ code: 1 });

    res.json(pantones);
  } catch (err) {
    res.status(500).json({ error: 'Error en búsqueda de Pantones', detail: err.message });
  }
});

// GET /api/pantones/:code - Obtener Pantone específico por código
router.get('/:code', async (req, res) => {
  try {
    const pantone = await Pantone.findOne({ code: req.params.code });
    
    if (!pantone) {
      return res.status(404).json({ error: 'Pantone no encontrado' });
    }

    res.json(pantone);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener Pantone', detail: err.message });
  }
});

// POST /api/pantones - Crear nuevo Pantone
router.post('/', async (req, res) => {
  try {
    const { code, hex, r, g, b } = req.body;

    // Validar datos requeridos
    if (!code || !hex || r === undefined || g === undefined || b === undefined) {
      return res.status(400).json({ error: 'Todos los campos son requeridos: code, hex, r, g, b' });
    }

    // Normalizar HEX a uppercase y 6 caracteres
    const normalizedHex = String(hex).toUpperCase().padStart(6, '0');

    // Validar formato HEX
    if (!/^[0-9A-F]{6}$/.test(normalizedHex)) {
      return res.status(400).json({ error: 'HEX debe ser 6 caracteres hexadecimales (0-9, A-F)' });
    }

    // Validar rango RGB
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      return res.status(400).json({ error: 'Valores RGB deben estar entre 0 y 255' });
    }

    // Verificar duplicado por código
    const existingCode = await Pantone.findOne({ code });
    if (existingCode) {
      return res.status(409).json({ error: `El código Pantone "${code}" ya existe` });
    }

    // Verificar duplicado por HEX
    const existingHex = await Pantone.findOne({ hex: normalizedHex });
    if (existingHex) {
      return res.status(409).json({ error: `El color HEX #${normalizedHex} ya está registrado` });
    }

    // Crear nuevo Pantone
    const newPantone = new Pantone({
      code: code.trim(),
      hex: normalizedHex,
      r: Number(r),
      g: Number(g),
      b: Number(b)
    });

    const saved = await newPantone.save();
    res.status(201).json(saved);
  } catch (err) {
    // Manejar error de validación de Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Error de validación', details: messages });
    }

    // Manejar error de índice único
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `${field} ya existe en la base de datos` });
    }

    res.status(500).json({ error: 'Error al crear Pantone', detail: err.message });
  }
});

module.exports = router;
