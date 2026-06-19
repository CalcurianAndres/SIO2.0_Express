const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let TasaSchema = new Schema({
  fecha: {
    type: Date,
    default: Date.now,
  },
  tasa: {
    type: Number,
    required: true,
  },
  fuente: {
    type: String,
    default: 'manual',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Tasa', TasaSchema);
