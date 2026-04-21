import { Schema, model } from 'mongoose';

const conversionSchema = new Schema({
  borrado: {
    type: Boolean,
    default: false,
  },
  status:{
    type:String,
    default:'Pendiente'
  },
  conversion: {
    type: Number,
    unique: true,
  },
  convertidora: {
    type:Schema.Types.ObjectId,
    ref: 'convertidora' 
  },
  material: {
    type:Schema.Types.ObjectId,
    ref: 'material' 
  },
  ancho: {
    type: String,
    required: true
  },
  largo: {
    type: String,
    required: true
  },
  peso: {
    type: String,
    required: true
  },
  lote: {
    type: String,
    required: true
  },
  cantidad: {
    type: String,
    required: true
  },
  observacion: {
    type: String,
    required: true
  },
  fabricacion:{
    type:String
  },
  usuario: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook para generar el número de conversión
conversionSchema.pre('save', async function (next) {
  if (this.conversion) return next(); // Si ya está definido, no hacer nada

  const Conversion = model('conversion', conversionSchema);
  const yearSuffix = new Date().getFullYear().toString().slice(-2); // "25"

  const base = parseInt(`${yearSuffix}000`);

  // Buscar el mayor número de conversión que comience con el año actual
  const ultimo = await Conversion
    .findOne({ conversion: { $gte: base } })
    .sort({ conversion: -1 });

  this.conversion = ultimo ? ultimo.conversion + 1 : base + 1;

  next();
});

export default model('conversion', conversionSchema);
