import producto from '../src/models/producto';
import gestiones from '../src/models/gestiones';
import productoTerminado from '../src/models/producto-terminado';
import HistorialCambios from '../src/models/historial-cambios';
const _ = require('lodash');

export default (socket, io) => {

    const emitirProductos = async () => {
        try {
            const Producto = await producto.find({ borrado: false })
                .populate('pre_impresion.pelicula.tintas.tinta identificacion.cliente identificacion.categoria materia_prima.sustrato materia_prima.tintas.tinta materia_prima.barnices.barniz pre_impresion.tamano_sustrato.montajes pre_impresion.tamano_sustrato.margenes pre_impresion.plancha impresion.impresoras impresion.pinzas post_impresion.troqueladora post_impresion.guillotina post_impresion.pegadora post_impresion.pegamento.pega post_impresion.caja')
                .populate({
                    path: 'materia_prima.sustrato',
                    populate: 'fabricante grupo especificacion especificacion2'
                })
                .populate({
                    path: 'materia_prima.barnices.barniz',
                    populate: 'fabricante grupo especificacion especificacion2'
                })
                .populate({
                    path: 'materia_prima.tintas.tinta',
                    populate: 'fabricante grupo especificacion especificacion2'
                })
                .populate({
                    path: 'impresion.fuentes',
                    populate: 'fabricante grupo especificacion especificacion2'
                })
                .populate({
                    path: 'pre_impresion.pelicula.tintas.tinta',
                    populate: 'fabricante grupo especificacion especificacion2'
                })
                .exec()
            io.emit('SERVER:producto', Producto)
            const Historiales = await HistorialCambios.find()
            io.emit('SERVER:historial', Historiales)
        } catch (error) {
            console.error('Error al buscar productos:', error)
        }
    }
    socket.on('CLIENTE:buscarProducto', async () => {
        try {
            await emitirProductos()
        } catch (err) {
            console.error('No se pudo realizar la busqueda de las productos')
        }
    })

    const emitirProductoTerminado = async () => {
        try {
            const productosTerminados = await productoTerminado.find()
                .populate({
                    path: 'op',
                })
                .populate('gestion')
                .exec();

            io.emit('SERVIDOR:enviarProductoTerminado', productosTerminados);
            emitirProductoTerminadoAgrupado();
        } catch (error) {
            console.error('Error al obtener productos terminados:', error);
        }
    };

    socket.on('CLIENTE:buscarProductoTerminado', async () => {
        await emitirProductoTerminado();
    });

    // function diffObjects(obj1, obj2) {
    //     const diff = {};
    //     for (let key in obj1) {
    //         if (obj1[key] !== obj2[key]) {
    //             if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
    //                 // Comparar objetos anidados recursivamente
    //                 const nestedDiff = diffObjects(obj1[key], obj2[key]);
    //                 if (Object.keys(nestedDiff).length > 0) {
    //                     diff[key] = nestedDiff;
    //                 }
    //             } else {
    //                 diff[key] = obj1[key];
    //             }
    //         }
    //     }
    //     return diff;
    // }

    function deepEqual(a, b) {
        if (a === b) return true; // Los valores son estrictamente iguales

        if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);

            if (keysA.length !== keysB.length) return false; // Diferente número de propiedades

            // Comparar cada propiedad de ambos objetos
            for (let key of keysA) {
                if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
                    return false; // Propiedad no coincide o su valor no es igual
                }
            }

            return true; // Los objetos son iguales
        }

        return false; // No son iguales
    }


    const emitirProductoTerminadoAgrupado = async () => {
        try {
            const registros = await productoTerminado.find({ borrado: { $ne: true } })
                .populate({
                    path: 'op'
                })
                .exec();

            // Agrupamos por el ID del producto (asumiendo que está en op.producto[0])
            const agrupado = registros.reduce((acc, curr) => {
                // Extraemos el ID y nombre del producto desde la OP
                // Ajusta esta ruta según la estructura exacta de tu esquema 'op'
                const productoInfo = curr.op?.producto[0];
                const productoId = productoInfo?._id?.toString() || 'sin-id';
                const productoNombre = productoInfo?.identificacion.producto || 'Producto sin nombre';

                if (!acc[productoId]) {
                    acc[productoId] = {
                        nombre: productoNombre,
                        cantidadTotal: 0,
                        totalOPs: 0,
                        detalles: []
                    };
                }

                // Sumamos cantidad y agregamos al detalle de la tabla
                acc[productoId].cantidadTotal += curr.cantidad || 0;
                acc[productoId].totalOPs += 1;
                acc[productoId].detalles.push({
                    opNumero: curr.op?.numero_op || 'N/A', // O el campo que uses para el número de OP
                    cantidad: curr.cantidad,
                    fecha: curr.createdAt // Fecha de fabricación
                });

                return acc;
            }, {});

            // Convertimos el objeto en un array para que el frontend lo recorra con un ngFor
            const resultadoFinal = Object.values(agrupado);

            io.emit('SERVIDOR:enviarProductoTerminadoAgrupado', resultadoFinal);

        } catch (error) {
            console.error('Error al agrupar productos:', error);
        }
    };


    socket.on('CLIENTE:NuevoProductoTerminado', async (data) => {
        try {
            const { gestion, op, cantidad, observacion } = data;

            // 1. Actualizar la Gestión: añade la fecha actual al array 'etiquetado'
            const gestionActualizada = await gestiones.findByIdAndUpdate(
                gestion,
                { $push: { etiquetado: new Date() } },
                { new: true }
            );

            if (!gestionActualizada) {
                throw new Error('No se encontró la gestión especificada');
            }

            // 2. Buscar o crear el Producto Terminado
            // Buscamos uno que coincida con el ID de la gestión
            let producto = await productoTerminado.findOne({ gestion: gestion });

            if (!producto) {
                producto = new productoTerminado({
                    gestion: gestion,
                    op: op,
                    cantidad: cantidad,
                    observacion: observacion
                });
                await producto.save();
            }

            // 3. Notificar al frontend
            emitirProductoTerminado();
            socket.emit('SERVIDOR:enviaMensaje', {
                mensaje: 'Producto actualizado y etiquetado correctamente',
                icon: 'success'
            });

        } catch (err) {
            console.error('Error en el proceso de producto terminado:', err);
            socket.emit('SERVIDOR:enviaMensaje', {
                mensaje: 'Error al intentar procesar el producto',
                icon: 'error'
            });
        }
    });


    socket.on('CLIENTE:nuevoProducto', async (data) => {
        try {
            if (data._id) {
                const existingProducto = await producto.findById(data._id);
                if (existingProducto) {

                    const cambios = {};

                    // Recorrer y comparar las claves del objeto `identificacion`
                    for (let key in data.identificacion) {
                        if (!deepEqual(data.identificacion[key], existingProducto.identificacion[key])) {
                            // Guardar solo si hay cambios reales
                            const safeKey = `identificacion_${key}`;
                            cambios[safeKey] = `De: ${existingProducto.identificacion[key]} A: ${data.identificacion[key]}`;
                        }
                    }

                    // Comparar las demás secciones (ejemplo: dimensiones, materia_prima, etc.)
                    for (let section in data) {
                        if (section !== 'identificacion' && section !== '_id' && typeof data[section] === 'object') {
                            for (let key in data[section]) {
                                // Comprobar si el valor ha cambiado realmente
                                if (!deepEqual(data[section][key], existingProducto[section][key])) {
                                    const safeKey = `${section}_${key}`;
                                    cambios[safeKey] = `De: ${JSON.stringify(existingProducto[section][key])} A: ${JSON.stringify(data[section][key])}`;
                                }
                            }
                        }
                    }

                    // Si hay cambios, guardarlos en el historial
                    if (Object.keys(cambios).length > 0) {
                        const nuevoHistorial = new HistorialCambios({
                            producto: data._id,
                            fechaCambio: Date.now(),
                            cambios
                        });
                        await nuevoHistorial.save();
                    }

                    // Actualizar el producto
                    await producto.findByIdAndUpdate(data._id, data);
                    socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Producto actualizado correctamente', icon: 'success' });
                } else {
                    socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se encontró ningún producto con el ID proporcionado', icon: 'warning' });
                }
            } else {
                const newProducto = new producto(data);
                await newProducto.save();
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Producto creado correctamente', icon: 'success' });
            }
            emitirProductos();
        } catch (err) {
            console.error('Error al procesar el producto:', err);
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error al procesar el producto', icon: 'error' });
        }
    });
}