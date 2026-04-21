
import devoluciones from "../src/models/devoluciones"
import { GuardarNotificacion } from "./notificacionesEvents"

export default (socket, io) => {
        let EmitirDevoluciones = async() => {

            try{
                const Devoluciones = await devoluciones.find({ borrado: false })
                                                        .populate('op')
                                                        .populate('material.asignacion')
                                                        .populate({
                                                            path: 'material.material',
                                                            populate: { path: 'material' } // Aquí haces populate de material.material.material
                                                        })
                                                        .exec();
                io.emit('SERVER:devoluciones', Devoluciones)
            }catch(err){
                console.log('Error al emitir devolucion', err)
            }
        }

        socket.on('CLIENTE:Devoluciones', async() =>{
            console.log('SE REALIZÓ BUSQUEDA DE DEVOLUCIONES')
            try{
                EmitirDevoluciones();
            }catch(err){    
                console.log('ERROR AL BUSCAR DEVOLUCIONES', err)
            }
        }) 

        socket.on("CLIENTE:NuevaDevolucion", async (data) => {
            try {
              // Si viene con _id, modificamos
              if (data._id) {
                // Buscar la devolución y actualizarla
                const devolucion = await devoluciones.findById(data._id);
                if (!devolucion) throw new Error('Devolución no encontrada');
          
                // Cambiar status a Confirmado
                devolucion.status = "Confirmado";
          
                // Si no tiene número aún, generar el correlativo
                if (!devolucion.numero) {
                  const year = new Date().getFullYear().toString().slice(-2); // últimos 2 dígitos del año
                  const prefix = year; // Año como prefijo
          
                  // Buscar el último número asignado
                  const ultima = await devoluciones
                    .findOne({ numero: { $ne: null } })
                    .sort({ numero: -1 });
          
                  // Extraer el número correlativo de la última devolución
                  let correlativo = 1;
                  if (ultima && ultima.numero) {
                    const lastNumber = ultima.numero.split('-')[1]; // obtener la parte numérica después del guion
                    correlativo = parseInt(lastNumber) + 1; // incrementar el número
                  }
          
                  // Formatear el número con ceros a la izquierda
                  const numeroFormateado = `${prefix}-${correlativo.toString().padStart(3, '0')}`;
          
                  devolucion.numero = numeroFormateado;
                }
          
                await devolucion.save();
          
                // Emitir mensaje de éxito
                io.emit('SERVIDOR:enviaMensaje', { mensaje: 'Devolución confirmada', icon: 'success' });
          
                // Emitir la lista actualizada
                await EmitirDevoluciones();
          
              } else {
                // Si no viene _id, creamos nueva devolución
                const nuevaDevolucion = new devoluciones(data);
                await nuevaDevolucion.save();
          
                io.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se realizó nueva devolución', icon: 'success' });
          
                await GuardarNotificacion(io, {
                  titulo: 'Devolución de material',
                  mensaje: 'Se realizó una devolución de material',
                  devolucion: nuevaDevolucion._id
                });
          
                await EmitirDevoluciones();
              }
            } catch (err) {
              console.log("Error al guardar la devolucion:", err);
            }
          });
          
          
}