const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let OrdenCompra = new Schema({
    borrado: {
        type: Boolean,
        default: false
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'cliente'
    },
    orden: {
        type: String,
    },
    fecha: {
        type: String,
    },
    recepcion: {
        type: String,
    },
    pedido: [{
        producto: {
            type: Schema.Types.ObjectId,
            ref: 'producto'
        },
        cantidad: {
            type: String,
        },
        solicitud: {
            type: String,
        },
        entrega: {
            type: String,
        },
        derivadas: [{
            nro: { type: String },
            cantidad: { type: Number },
            solicitud: { type: String },
            entrega: { type: String },
            facturado: { type: String }
        }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('ocompra', OrdenCompra);
