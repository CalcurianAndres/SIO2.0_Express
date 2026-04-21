const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let TicketAmarilloSchema = new Schema([{
        borrado:{
            type:Boolean,
            default:false,
        },
        op:{
            type: Schema.Types.ObjectId,
            ref: 'op'
        },
        defectos:[{
            type:String
        }],
        fase:{
            type:String
        },
        causa:{
            type:String
        },
        identificacion: {
            type: String
        },
        accion:{
            type:String
        },
        responsable:{
            type:String
        },
        area_accion:{
            type:String
        },
        otro:{
            type:String
        },
        supervisor:{
            type:String
        },
        analista:{
            type:String,
        },
        paleta:{
            type:Number
        },
        tipo:{
            type:String
        }
        

}],{
    timestamps:true
});

module.exports = mongoose.model('TicketAmarillo', TicketAmarilloSchema)