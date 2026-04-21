const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let RequisicionSchema = new Schema([{
        status:{
            type:String,
            default:'Por Aceptar',
        },
        materiales:[{
            material:{
                type:Schema.Types.ObjectId,
                ref: 'material'
            },
            cantidad:{
                type:Number,
            }
        }],
        motivo:{
            type:String
        },
        numero:{
            type:String
        },
        op: {
            type: Schema.Types.Mixed,
            ref: 'op'
        },
        tag:{
            type:String
        },
        material:{
            type:Schema.Types.ObjectId,
            ref: 'material'
        },
        cantidad:{
            type:Number
        },
        analisis:{
            type:Schema.Types.ObjectId,
            ref: 'AnalisisTinta'
        },
        solicitado:{
            type:Schema.Types.ObjectId,
            ref:'Usuario'
        },
        recibido:{
            type:Schema.Types.ObjectId,
            ref: 'Usuario'
        }

}],{
    timestamps:true
});

module.exports = mongoose.model('requisiciones', RequisicionSchema)