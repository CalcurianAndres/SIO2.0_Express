const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let TicketRojoSchema = new Schema([{
        borrado:{
            type:Boolean,
            default:false,
        },
        cerrado:{
            type:Boolean,
            default:false
        },
        op:{
            type: Schema.Types.ObjectId,
            ref: 'op'
        },
        tipo:{
            type:String
        },
        defectos:{
            type:String
        },
        causa:{
            type:String
        },
        fase:{
            type:Number
        },
        observacion:{
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
        cantidad:{
            type:String
        },
        destructor:{
            type:String
        },
        fecha_destruccion:{
            type:String
        }
}],{
    timestamps:true
});

module.exports = mongoose.model('TicketRojo', TicketRojoSchema)