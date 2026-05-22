const mongoose = require('mongoose');
let Schema = mongoose.Schema;


let ProductoTerminado = new Schema({
    despachado: {
        type: Boolean,
        defaul: false,
    },
    borrado: {
        type: Boolean,
        default: false
    },
    op: {
        type: Schema.Types.ObjectId,
        ref: 'op'
    },
    cantidad: {
        type: Number,
    },
    observacion: {
        type: String
    },
    gestion: {
        type: Schema.Types.ObjectId,
        ref: 'gestion'
    },
    copia: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('productoTerminado', ProductoTerminado)
