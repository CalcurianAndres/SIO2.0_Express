const mongoose = require('mongoose');

const devolucionSchema = new mongoose.Schema({
  op: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'op',
    required: true
  },
  material: [{
    asignacion:{
        type:String
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'almacen',
      required: true
    },
    cantidad: {
      type: Number,
      required: true
    }
  }],
  numero: {
    type: String,
  },
  status:{
    type:String,
    default:'Por Confirmar'
  },
  observacion:{
    type:String
  },
  borrado: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('devolucion', devolucionSchema);