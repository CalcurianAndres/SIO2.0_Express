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
    OCPI.findOneAndUpdate(
        {_id: counterId},
        {
            $inc: {seq: 1},
            $setOnInsert: {_id: counterId, seq: seqInicial}
        },
        {new: true, upsert: true}
    ).then(function(counter) {
        doc.numero = counter.seq;
        next();
    })
    .catch(function(error) {
        throw error;
    });
});

module.exports = mongoose.model('ordenPoligrafica', OrdenPoligraficaSchema)
