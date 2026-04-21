import convertidora from '../src/models/convertidora';
import bobinas from '../src/models/bobinas';
import conversion from '../src/models/conversion'
import { Socket } from 'socket.io';
export default (socket, io) => {


    const EmitirConvertidora = async() => {
        try{
            const Convertidora = await convertidora.find({borrado:false}).exec();
            
            io.emit('SERVER:Convertidora', Convertidora)
        }catch (err){
            console.log('Error en la busqueda de convertidoras', err)
        }
    }
    
    socket.on('CLIENTE:BuscarConvertidora', async()=>{
        try {
            await EmitirConvertidora()
          } catch (err) {
            console.error('No se pudo realizar la busqueda del convertidora', err)
          }
    })

    socket.on('CLIENTE:BuscarBobinas', async()=>{
        try {
            await EmitirBobinas()
          } catch (err) {
            console.error('No se pudo realizar la busqueda del convertidora', err)
          }
    })

    const EmitirBobinas = async() => {
        try{
            const Bobinas = await bobinas.find({borrado:false})
            .populate('material').exec();
            io.emit('SERVER:Bobinas', Bobinas)
        }catch (err){
            console.log('Error en la busqueda de bobinas', err)
        }
    }

    // :::::::::::::::::::::::::::::CONVERSIONES:::::::::::::::::::::::::::::::::::::::::::::::

    const EmitirConversiones = async() => {
        try{
            const Conversiones = await conversion.find({borrado:false}).populate('material').exec()
            io.emit('SERVER: conversiones', Conversiones)
        }catch(err){
            console.log('Error en la emisión de conversiones', err)
        }
    }

    socket.on('CLIENTE:BuscarConversion', async()=>{
        try{
            await EmitirConversiones()
        }catch(err){
            console.error('No se pudo realizar la busqueda de la conversión', err)
        }
    })

    socket.on('CLIENTE:NuevaConversion', async (data) => {
        try{
            const Conversion = new conversion(data);
            await Conversion.save();
            socket.emit('SERVIDOR:enviaMensaje', {mensaje:'Se registró nueva conversion', icon:'success'});
            EmitirConversiones();
        }catch(err){
            socket.emit('SERVIDOR:enviaMensaje', {mensaje:'No se pudo registrar conversión', icon:'error'});
            console.log('Error en el registro de conversion', err)
        }
    })

    // :::::::::::::::::::::::::::::CONVERSIONES:::::::::::::::::::::::::::::::::::::::::::::::

    socket.on('CLIENTE:NuevaBobina', async (data) => {
        try {
            await bobinas.insertMany(data);
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se registraron bobinas', icon: 'success' });
            EmitirBobinas();
        } catch (err) {
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se pudieron registrar bobinas', icon: 'error' });
            console.log('Error en el registro de bobinas', err);
        }
    });

    socket.on('CLIENTE:EditarBobinas', async (data) => {
    try {

        console.log(data)

        // data es un arreglo de bobinas con su _id y el nuevo neto
        const bulkOps = data.map(bobina => ({
            updateOne: {
                filter: { _id: bobina._id },
                update: { $set: { neto: bobina.neto } }
            }
        }));

        await bobinas.bulkWrite(bulkOps);
        
        socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Bobinas actualizadas correctamente', icon: 'success' });
        EmitirBobinas(); // para reenviar las bobinas actualizadas
    } catch (err) {
        socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error actualizando bobinas', icon: 'error' });
        console.log('Error actualizando bobinas', err);
    }
});

    socket.on('CLIENTE:NuevaConvertidora', async(data) => {
                try{
                    if(data._id){
                        await convertidora.findByIdAndUpdate(data._id, data);
                        EmitirConvertidora();
                        socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se actualizó convertidora', icon: 'info' });
                        console.log('Se actualizó convertidora');
                        return
                    }else{
                        const Convertidora = new convertidora(data)
                        try{
                            await Convertidora.save();
                            console.log('Se registró convertidora');
                            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se registó convertidora', icon: 'success' });
                            EmitirConvertidora();
                        }catch(err){
                            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se pudo registrar convertidora', icon: 'error' });
                            console.log('Error en el registro de convertidora', err)
                        }
                    }
    
                }catch(err){
    
                    console.log('Error al registrar convertidora:', err)
                }
    })


}