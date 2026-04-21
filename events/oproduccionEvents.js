const webPush = require('web-push');
import op from '../src/models/ordenProduccion';
import subscriptions from '../src/models/subscriptions';
import gestion from '../src/models/gestiones';
import Asignacion from '../src/models/Asignaciones';
import requisiciones from '../src/models/requisicion';
import TicketAmarillo from '../src/models/ticket-amarillo';
import ticketAmarillo from '../src/models/ticket-amarillo';
import ticketRojo from '../src/models/ticket-rojo';


export default(socket, io) => {
    // Función para enviar notificación
    function sendNotification(subscription, payload) {
        webPush.sendNotification(subscription, payload)
        .then(response => console.log('Notificación enviada', response))
        .catch(error => console.error('Error al enviar la notificación:', error));
    }

    const EmitirOP = async() =>{
        try {
            const ordenes = await op.find({ borrado: false , numero_op: { $ne: '2000000' }})
                                    .populate('cliente')
                                    .populate('oc')
                                    .populate('sustrato.sustrato')
                                    .populate('tinta.tinta')
                                    .populate({
                                        path: 'tinta.tinta',
                                        populate: {
                                          path: 'fabricante'
                                        }
                                      })
                                    .populate('barniz.barniz')
                                    .populate('pega.pega')
                                    .populate('fases.maquina')
                                                  
          io.emit('SERVER:OrdenProduccion', ordenes);
          } catch (error) {
          console.error('Ha ocurrido un error al consultar las ordenes de producción:', error);
          }
    };

    const EmitirGestiones = async() =>{
        try {
            const Gestiones = await gestion.find({ borrado: false })
                                    .populate('orden')
          io.emit('SERVER:Gestiones', Gestiones);
          } catch (error) {
          console.error('Ha ocurrido un error al consultar gestiones:', error);
          }
    };

    const EmitirAsignaciones = async() =>{
        try{
            const asignaciones = await Asignacion.find()
                        .populate('op')
                        // .populate('nombre fecha')
                        .populate({
                            path: 'material.material', // Segundo nivel
                            populate: {
                            path: 'material', // Tercer nivel
                            }
                        })
                        .exec();

            io.emit('SERVER:Asignaciones', asignaciones);

        } catch(err){
            console.error('Ha ocurrido un error en la busqueda de asignaciones', err);
        }
    }

    const EmitirTicketsAmarillos = async() => {
        try{
            const ticket_amarillo = await TicketAmarillo.find({borrado:false})
                                                .populate('op')
            
            io.emit('SERVER:TicketAmarillo', ticket_amarillo)
        }catch(err){
            console.error('Ha ocurrido un error en la emision de tickets amarillos', err);
        }
    }

    const EmitirTicketRojo = async() => {
        try{
            const ticket_rojo = await ticketRojo.find({borrado:false})
                                                .populate({
                                                    path: 'op',
                                                    populate: {
                                                    path: 'fases',
                                                    populate: {
                                                        path: 'maquina'
                                                    }
                                                    }
                                                });
            io.emit('SERVER:TicketRojo', ticket_rojo)
        }catch(err){
            console.error('Ha ocurrido un error en la emision de tickets rojos', err)
        }
    }


    socket.on('CLIENTE:BuscarOrdenProduccion', async () => {
        await EmitirOP();
    });

    socket.on('Cliente:Gestiones', async () => {
        await EmitirGestiones();
    })

    socket.on('CLIENTE:Asignaciones', async() => {
        await EmitirAsignaciones();
    })

    socket.on('CLIENTE:TicketAmarillo', async() => {
        await EmitirTicketsAmarillos();
    })

     socket.on('CLIENTE:TicketRojo', async() => {
        await EmitirTicketRojo();
    })

    // ****************** NUEVA ORDEN DE PRODUCCIÓN ************************

    socket.on('CLIENTE:NuevaOrdenProduccion', async (data, requisicion) => {
      const nuevaOrden = new op(data);

      console.log(requisicion)

   
      try {
         const nuevaOrdenGuardada = await nuevaOrden.save();
         console.log('Se registró una nueva orden de producción', nuevaOrdenGuardada);
        
         if(!requisicion.op){
             requisicion.op = nuevaOrdenGuardada._id
         }

        if (!requisicion.numero) {
            const year = new Date().getFullYear().toString().slice(-2); // últimos 2 dígitos del año
            const prefix = year; // Año como prefijo

            // Buscar el último número asignado
            const ultima = await requisiciones
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

            requisicion.numero = numeroFormateado;
        }

        const NuevaRequisicion = new requisiciones(requisicion);
        await NuevaRequisicion.save();


        const Requisicion = await requisiciones.find()
                .populate('materiales.material')
                .populate('material')
                .populate('material.fabricante')
                .populate('op')
                .exec();
              
        io.emit('SERVER:Requisicion', Requisicion)
         
         // Emitir mensaje al cliente después de guardar la orden
         socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se registró una nueva orden de producción', icon: 'success' });
   
         // Recuperar y enviar notificaciones
         const subscriptions_ = await subscriptions.find().lean(); // `lean()` para una mejor performance si no se necesita modificar los datos
         const payload = JSON.stringify('Se generó nueva orden de producción, nueva asignación pendiente');
   
         // Evitar enviar notificaciones repetidas
         const uniqueSubscriptions = new Set();
         subscriptions_.forEach(subscription => {
            if (!uniqueSubscriptions.has(subscription.endpoint)) {
               uniqueSubscriptions.add(subscription.endpoint);
               sendNotification(subscription, payload);
            }
         });
   
         console.log({ message: 'Notificaciones enviadas' });
         await EmitirOP();
         await EmitirAsignaciones();
   
      } catch (error) {
         console.error('No se pudo registrar la orden de producción', error);
         socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error en el registro de la orden de producción', icon: 'error' });
      }
   });

   socket.on('CLIENTE:ActualizarOrdenProduccion', async (data) => {
      try {
          // Asumiendo que 'data' tiene un campo 'id' para identificar la orden
          const ordenActualizada = await op.findByIdAndUpdate(data._id, { status: 'En producción' }, { new: true });
          
          if (ordenActualizada) {
              console.log('Se actualizó el estado de la orden de producción a En producción', ordenActualizada);
              
              // Emitir mensaje al cliente después de actualizar la orden
              socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se actualizó el estado de la orden de producción a En producción', icon: 'success' });
          } else {
              console.log('No se encontró la orden de producción con el ID especificado');
              socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se encontró la orden de producción con el ID especificado', icon: 'error' });
          }
      } catch (error) {
          console.error('No se pudo actualizar la orden de producción', error);
          socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error en la actualización de la orden de producción', icon: 'error' });
      }
  
      await EmitirOP();
  });

  socket.on('CLIENTE:ActualizarOrdenProduccion_', async (data) => {
    try {
        // Asumiendo que 'data' tiene un campo 'id' para identificar la orden
        const ordenActualizada = await op.findByIdAndUpdate(data._id, data, { new: true });
        
        if (ordenActualizada) {
            console.log('Se actualizó el estado de la orden de producción a En producción ...', ordenActualizada);
            
            // Emitir mensaje al cliente después de actualizar la orden
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se actualizó el estado de la orden de producción a En producción', icon: 'success' });
        } else {
            console.log('No se encontró la orden de producción con el ID especificado');
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se encontró la orden de producción con el ID especificado', icon: 'error' });
        }
    } catch (error) {
        console.error('No se pudo actualizar la orden de producción', error);
        socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error en la actualización de la orden de producción', icon: 'error' });
    }

    await EmitirOP();
});

  socket.on('CLIENTE:NuevaGestion', async (data) => {
    const nuevaGestion = new gestion(data);
 
    try {
       const nuevaGestionGuardada = await nuevaGestion.save();
       console.log('Se registró una nueva gestión', nuevaGestionGuardada);
       
       // Emitir mensaje al cliente después de guardar la orden
       socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se registró una nueva gestión', icon: 'success' });
       await EmitirOP();
       await EmitirGestiones();
 
    } catch (error) {
       console.error('No se pudo registrar la orden de producción', error);
       socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error en el registro de la orden de producción', icon: 'error' });
    }
 });

    socket.on('CLIENTE:NuevoTicketAmarillo', async (data) => {
        const nuevoTicket = new ticketAmarillo(data);

        try{
            const nuevoTicketAmarilloGuardado = await nuevoTicket.save();
            await EmitirTicketsAmarillos();
        }catch(err){
            console.error('No se pudo registrar ticket amarillo', err);
            socket.emit('SERVIDOR:enviaMensaje', {mensaje:'Error en el registro de ticket amarillo', icon:'error'})
        }
    })

    socket.on('CLIENTE:NuevoTicketRojo', async (data) => {
    try {
        let ticketRojoGuardado;

        if (data._id) {
            // Si tiene _id, intenta actualizar el ticket existente
            ticketRojoGuardado = await ticketRojo.findByIdAndUpdate(
                data._id,
                data,
                { new: true } // Para que retorne el documento actualizado
            );
            if (!ticketRojoGuardado) throw new Error('Ticket no encontrado para actualizar');
        } else {
            // Si no tiene _id, se crea un nuevo ticket
            const nuevoTicket = new ticketRojo(data);
            ticketRojoGuardado = await nuevoTicket.save();
        }

        await EmitirTicketRojo();
        socket.emit('SERVIDOR:enviaMensaje', {
            mensaje: data._id ? 'Ticket rojo actualizado' : 'Nuevo ticket rojo creado',
            icon: 'success'
        });

        } catch (err) {
            console.error('Error al registrar/actualizar ticket rojo', err);
            socket.emit('SERVIDOR:enviaMensaje', {
                mensaje: 'Error en el registro de ticket rojo',
                icon: 'error'
            });
        }
    });


}