import trabajador from '../src/models/trabajador'
import Contratacion from '../src/models/contrataciones'

const stringId = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (value.toString) return value.toString()
    return ''
}

const contratosSonIguales = (a, b) => {
    if (!a || !b) return false
    return (
        stringId(a.departamento) === stringId(b.departamento) &&
        stringId(a.cargo) === stringId(b.cargo) &&
        stringId(a.de) === stringId(b.de) &&
        String(a.sueldo || '') === String(b.sueldo || '') &&
        Number(a.tasa || 0) === Number(b.tasa || 0)
    )
}

export default(socket, io) => {
    const EmitirTrabajador = async (incluirBorrados = false) => {
        try{
            const filtro = incluirBorrados ? {} : { borrado: false }
            const Trabajador = await trabajador.find(filtro)
                                                .populate('contratacion.departamento')
                                                .populate('contratacion.cargo')
                                                .populate('contratacion.de')
                                                .exec()
            io.emit('SERVER:Trabajador', Trabajador)
            const Contrataciones = await Contratacion.find()
                                                .populate('departamento')
                                                .populate('cargo')
                                                .populate('de')
                                                .exec()
            io.emit('SERVER:Contrataciones', Contrataciones)
        }catch(err){
            console.log('Error en la emisión de los trabajadores:', err)
    }}

    socket.on('CLIENTE:Trabajador', async(payload) => {
        try{
            const incluirBorrados = payload && payload.incluirBorrados === true
            EmitirTrabajador(incluirBorrados)
        }catch(err){
            console.log('Error no se pudo realizar la llamada a la emisión de trabajadores:', err)
        }
    })

    const crearContratacionActiva = async (dataContratacion, trabajadorId) => {
        const nueva = new Contratacion({
            fecha: dataContratacion.fecha || new Date(),
            departamento: dataContratacion.departamento || null,
            cargo: dataContratacion.cargo || null,
            de: dataContratacion.de || null,
            sueldo: dataContratacion.sueldo || '',
            tasa: dataContratacion.tasa || 0,
            activo: true,
            trabajador: trabajadorId,
        })
        await nueva.save()
        return nueva
    }

    const desactivarContratacionesAnteriores = async (trabajadorId) => {
        await Contratacion.updateMany(
            { trabajador: trabajadorId, activo: true },
            { activo: false }
        )
    }

    socket.on('CLIENTE:nuevoTrabajador', async (data) => {
    try {
        const dataContratacion = data.contratacion || {}

        if (data._id) {
            const existingWorker = await trabajador.findById(data._id);

            if (existingWorker) {
                const contratoCambio = !contratosSonIguales(existingWorker.contratacion, dataContratacion)

                if (contratoCambio) {
                    await desactivarContratacionesAnteriores(data._id)
                    await crearContratacionActiva(dataContratacion, data._id)
                } else if (dataContratacion.tasa && Number(existingWorker.contratacion?.tasa || 0) !== Number(dataContratacion.tasa)) {
                    // Solo cambió la tasa: actualizar el contrato activo actual
                    await Contratacion.updateOne(
                        { trabajador: data._id, activo: true },
                        { tasa: dataContratacion.tasa }
                    )
                }

                // Recuperar el contrato activo para sincronizar el subdocumento del trabajador
                const contratoActivo = await Contratacion.findOne({ trabajador: data._id, activo: true })
                if (contratoActivo) {
                    data.contratacion = {
                        fecha: contratoActivo.fecha,
                        departamento: contratoActivo.departamento,
                        cargo: contratoActivo.cargo,
                        de: contratoActivo.de,
                        sueldo: contratoActivo.sueldo,
                        tasa: contratoActivo.tasa,
                    }
                }

                await trabajador.findByIdAndUpdate(data._id, data);
                EmitirTrabajador();
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se actualizó el trabajador', icon: 'info' });
                console.log('Se actualizó un trabajador');
                return;
            }
        } else {
            const Trabajador = new trabajador(data);

            try {
                const savedTrabajador = await Trabajador.save();
                console.log('Se creó el registro nuevo trabajador');
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se registró nuevo trabajador', icon: 'success' });

                const contratoActivo = await crearContratacionActiva(dataContratacion, savedTrabajador._id)

                // Sincronizar el subdocumento del trabajador con el contrato activo creado
                savedTrabajador.contratacion = {
                    fecha: contratoActivo.fecha,
                    departamento: contratoActivo.departamento,
                    cargo: contratoActivo.cargo,
                    de: contratoActivo.de,
                    sueldo: contratoActivo.sueldo,
                    tasa: contratoActivo.tasa,
                }
                await savedTrabajador.save()

                EmitirTrabajador();
            } catch (err) {
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'No se pudo registrar el trabajador', icon: 'error' });
                console.log('Error en el registro del trabajador', err);
            }
        }
    } catch (err) {
        console.log('Error en el registro del trabajador:', err);
    }
});


    socket.on('CLIENTE:EliminarTrabajador', async (data) => {
        try{
            await trabajador.findByIdAndUpdate(data._id, {borrado:true})
            try{
                EmitirTrabajador();
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se eliminó el trabajador', icon: 'info' });
            }catch(err){
                console.log(err)
            }
        }catch(err){
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error en la eliminación del trabajador', icon: 'error' });
            console.log('Error en la eliminación del trabajador', err)
        }
    })

    socket.on('CLIENTE:DarDeBajaTrabajador', async (data) => {
        try{
            await trabajador.findByIdAndUpdate(data._id, {borrado:true, fechaBaja: new Date()})
            try{
                // Re-fetchear y emitir SOLO a este socket
                const trabActualizados = await trabajador.find({})
                                                .populate('contratacion.departamento')
                                                .populate('contratacion.cargo')
                                                .populate('contratacion.de')
                                                .exec()
                socket.emit('SERVER:Trabajador', trabActualizados)
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se dio de baja al trabajador', icon: 'info' });
            }catch(err){
                console.log(err)
            }
        }catch(err){
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error al dar de baja al trabajador', icon: 'error' });
            console.log('Error al dar de baja al trabajador', err)
        }
    })

    socket.on('CLIENTE:ReactivarTrabajador', async (data) => {
        try{
            await trabajador.findByIdAndUpdate(data._id, {borrado:false, fechaBaja: null})
            try{
                // Re-fetchear y emitir SOLO a este socket
                const trabActualizados = await trabajador.find({})
                                                .populate('contratacion.departamento')
                                                .populate('contratacion.cargo')
                                                .populate('contratacion.de')
                                                .exec()
                socket.emit('SERVER:Trabajador', trabActualizados)
                socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Se reactivó al trabajador', icon: 'success' });
            }catch(err){
                console.log(err)
            }
        }catch(err){
            socket.emit('SERVIDOR:enviaMensaje', { mensaje: 'Error al reactivar al trabajador', icon: 'error' });
            console.log('Error al reactivar al trabajador', err)
        }
    })
}
