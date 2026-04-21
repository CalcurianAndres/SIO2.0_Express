import ocompra from '../src/models/orden-compra'
export default (socket, io) => {
    // *******************
    // * BUSCAR Orden *
    // *******************
    const EmitirOrdenes = async () => {
        try {
            const ordenes = await ocompra.find({ borrado: false })
                .populate('cliente')
                .populate({
                    path: 'pedido',
                    populate: {
                        path: 'producto',
                        populate: [
                            { path: 'impresion.impresoras', populate: { path: 'fases' } },
                            { path: 'post_impresion.troqueladora', populate: { path: 'fases' } },
                            { path: 'post_impresion.guillotina', populate: { path: 'fases' } },
                            { path: 'post_impresion.pegadora', populate: { path: 'fases' } },
                            { path: 'post_impresion.otros', populate: { path: 'fases' } },
                            { path: 'pre_impresion.pelicula.tintas.tinta' },
                            { path: 'post_impresion.pegamento.pega' },
                            { path: 'materia_prima.barnices.barniz' },
                            { path: 'materia_prima.sustrato' },
                            { path: 'identificacion.cliente' }
                        ]
                    }
                });
            io.emit('SERVER:OrdenesCompra', ordenes);
        } catch (error) {
            console.error('Ha ocurrido un error al consultar las ordenes:', error);
        }
    };

    socket.on('CLIENTE:BuscarOrdenesCompra', async () => {
        await EmitirOrdenes();
    });

    // *******************
    // * NUEVA ORDEN POLIGRÁFICA *
    // *******************
    // Este código escucha el evento 'CLIENTE:NuevaOrdenPoligrafica' en un socket.
    // Cuando se activa este evento, crea un nuevo objeto OrdenPoligrafica con los datos recibidos,
    // lo guarda en la base de datos y luego emite una actualización de órdenes poligráficas.
    socket.on('CLIENTE:NuevaOrdenCompra', async (data) => {
        try {
            let ordenResultado;

            if (data._id) {
                // MODO EDICIÓN: El gato ya existe, solo estamos actualizando su posición
                // { new: true } es para que nos devuelva el documento ya actualizado
                ordenResultado = await ocompra.findByIdAndUpdate(data._id, data, { new: true });
                console.log('Orden de compra actualizada:', ordenResultado._id);

                socket.emit('SERVIDOR:enviaMensaje', {
                    mensaje: 'Orden de compra actualizada con éxito',
                    icon: 'success'
                });
            } else {
                // MODO NUEVO: Ha nacido una nueva orden
                const nuevaOrden = new ocompra(data);
                ordenResultado = await nuevaOrden.save();
                console.log('Nueva orden registrada:', ordenResultado._id);

                socket.emit('SERVIDOR:enviaMensaje', {
                    mensaje: 'Nueva orden registrada con éxito',
                    icon: 'success'
                });
            }

            // En ambos casos, notificamos a todos los interesados
            await EmitirOrdenes();

        } catch (error) {
            console.error('Error en el proceso de la orden:', error);
            socket.emit('SERVIDOR:enviaMensaje', {
                mensaje: 'Error procesando la orden de compra',
                icon: 'error'
            });
        }
    });
}