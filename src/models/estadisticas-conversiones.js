import {Schema, model} from 'mongoose';

const ClienteSchema = new Schema({
    borrado:{
        type:Boolean,
        default:false,
    },
    descuento:{
        type:Number,
        required:true
    },
    teorica:{
        type:Number,
        required:true
    },
    recibida:{
        type:Number,
        required:true
    },
    tipo:{
        type:Schema.Types.ObjectId,
        ref: 'grupo' 
    },
    contactos:[{
        nombre:{type:String, required:true},
        titulo:{type:String, required:true},
        correo:{type:String, required:true},
        telefono:{type:String, required:true},
        cargo:{type:String, required:true}
    }],
    almacenes:[
        {
            nombre:{type:String, required:true}
        }
    ]
},{
    timestamps:true
})

export default model('cliente', ClienteSchema)