const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let TasaSchema = new Schema({
  fecha: {
    type: Date,
    default: Date.now,
    index: true,
  },
  tasa: {
    type: Number,
    required: true,
    min: [0.01, 'La tasa debe ser un número positivo'],
    validate: {
      validator: (v) => Number.isFinite(v) && v > 0 && v < 1e9,
      message: 'La tasa debe ser un número finito y positivo',
    },
  },
  fuente: {
    type: String,
    enum: ['api', 'manual'],
    default: 'manual',
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false,
  },
}, {
  timestamps: true,
});

TasaSchema.index({ fecha: -1 });
TasaSchema.index({ fecha: -1, fuente: 1 });

module.exports = mongoose.model('Tasa', TasaSchema);
