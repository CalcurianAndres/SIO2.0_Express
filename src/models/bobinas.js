
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DetalleSchema = new Schema({
  ancho: { type: Number, required: true },
  codigo: { type: Number, required: true },
  convertidora: { type: Schema.Types.ObjectId, ref: 'convertidora', required: true },
  lote: { type: String, required: true },
  material: { type: Schema.Types.ObjectId, ref: 'material', required: true },
  neto: { type: String, required: true }, // Si siempre es numérico, conviene cambiar a Number
  oc: { type: Schema.Types.ObjectId, ref: 'ordenPoligrafica', required: true },
  presentacion: { type: String, required: true },
  unidad: { type: String, required: true },
  borrado: { type: Boolean, default: false },
  fabricacion:{type: String}
}, { timestamps: true });

module.exports = mongoose.model('bobinas', DetalleSchema);