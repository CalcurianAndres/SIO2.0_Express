const mongoose = require('mongoose');
let Schema = mongoose.Schema;

var OCPoligrafica_iterador = new mongoose.Schema({
    _id: {type: String, required:true},
    seq: {type: Number, default: 24000}
});

var OCPI = mongoose.model('OCPI', OCPoligrafica_iterador);

function getAnio() {
    return new Date().getFullYear().toString().slice(-2);
}

function getSeqInicial() {
    return parseInt(getAnio() + '000000');
}

function getCounterId() {
    return 'OCPi_' + getAnio();
}


let OrdenPoligraficaSchema = new Schema({
    numero:{
        type:Number
    },
    proveedor: {
        type:Schema.Types.ObjectId,
        ref: 'proveedor'
    },
    borrado:{
        type:Boolean,
        default:false,
    },
    iva: { type: Number, default: 16 },
    pedido: [{ 
        material: {
            type:Schema.Types.ObjectId,
            ref: 'material'
        },
        bobina: { type: Boolean, default: false },
        cantidad: {type: Number},
        precio: {type: Number},
        alto:{type:Number},
        ancho:{type:Number},
        gramaje:{type:String},
        calibre:{type:String},
        unidad: {type: String,
                enum: ['L', 'kg', 'Und','t'],
                }
    }],
    pago: { type: String },
    entrega: { type: String },
    descripcion: { type: String }
},{
    timestamps:true
})


OrdenPoligraficaSchema.pre('save', function(next){
    var doc = this;
    var counterId = getCounterId();
    var seqInicial = getSeqInicial();

    // Fase 1: Crear contador si no existe (solo $setOnInsert — sin conflicto con $inc)
    OCPI.findOneAndUpdate(
        { _id: counterId },
        { $setOnInsert: { _id: counterId, seq: seqInicial } },
        { upsert: true, new: true }
    ).then(function() {
        // Fase 2: Incrementar contador (solo $inc — sin conflicto con $setOnInsert)
        return OCPI.findOneAndUpdate(
            { _id: counterId },
            { $inc: { seq: 1 } },
            { new: true }
        );
    }).then(function(counter) {
        if (!counter) {
            return next(new Error('No se pudo generar el correlativo: contador nulo'));
        }
        doc.numero = counter.seq;
        next();
    }).catch(function(error) {
        next(error);
    });
});

module.exports = mongoose.model('ordenPoligrafica', OrdenPoligraficaSchema)
