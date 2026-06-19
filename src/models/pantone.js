import { Schema, model } from 'mongoose';

const pantoneSchema = new Schema({
  code: {
    type: String,
    required: [true, 'El código Pantone es obligatorio'],
    unique: true,
    trim: true
  },
  hex: {
    type: String,
    required: [true, 'El valor HEX es obligatorio'],
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 6,
    match: [/^[0-9A-F]{6}$/, 'HEX debe ser 6 caracteres hexadecimales']
  },
  r: {
    type: Number,
    required: [true, 'El valor R (rojo) es obligatorio'],
    min: [0, 'R debe estar entre 0 y 255'],
    max: [255, 'R debe estar entre 0 y 255']
  },
  g: {
    type: Number,
    required: [true, 'El valor G (verde) es obligatorio'],
    min: [0, 'G debe estar entre 0 y 255'],
    max: [255, 'G debe estar entre 0 y 255']
  },
  b: {
    type: Number,
    required: [true, 'El valor B (azul) es obligatorio'],
    min: [0, 'B debe estar entre 0 y 255'],
    max: [255, 'B debe estar entre 0 y 255']
  }
}, {
  timestamps: true,
  collection: 'pantones'
});

export default model('Pantone', pantoneSchema);
