import almacenEvents from '../events/almacenEvents';
import analisisEvents from '../events/analisisEvents';
import cargoEvents from '../events/cargoEvents';
import categoriaEvents from '../events/categoriaEvents';
import clienteEvents from '../events/clienteEvents';
import defectoEvents from '../events/defectoEvents';
import departamentoEvents from '../events/departamentoEvents';
import devolucionesEvents from '../events/devolucionesEvents'
import especificacionEvents from '../events/especificacionEvents';
import fabricanteEvents  from '../events/fabricanteEvents'
import fasesEvents from '../events/fasesEvents';
import formulaEvents from '../events/formulaEvents';
import grupoEvents from '../events/grupoEvents';
import horarioEvents from '../events/horarioEvents';
import maquinasEvents from '../events/maquinasEvents';
import materialEvents from '../events/materialEvents'
import notificacionesEvents from '../events/notificacionesEvents'
import ocompraEvents from '../events/ocompraEvents';
import opoligraficaEvents from '../events/opoligraficaEvents';
import oproduccionEvents from '../events/oproduccionEvents';
import productoEvents from '../events/productosEvents';
import proveedorEvents  from '../events/proveedorEvents'
import recepcionEvents from '../events/recepcionEvents'
import requisicionEvents from '../events/requisicionEvents';
import trabajadorEvents from '../events/trabajadorEvents';
import bobinaEvents from '../events/bobinaEvents';
import tasaEvents from '../events/tasaEvents';

export default function configureEvents(io) {
    io.on('connection', (socket) => {
        
        almacenEvents( socket, io)
        analisisEvents(socket, io)
        cargoEvents(socket, io)
        categoriaEvents(socket, io)
        clienteEvents(socket, io)
        defectoEvents(socket, io)
        departamentoEvents(socket, io)
        devolucionesEvents(socket, io)
        especificacionEvents(socket, io)
        fabricanteEvents(socket, io)
        fasesEvents(socket, io)
        formulaEvents(socket, io)
        grupoEvents(socket, io);
        horarioEvents(socket, io)
        maquinasEvents(socket, io)
        materialEvents(socket, io)
        ocompraEvents(socket, io)
        opoligraficaEvents(socket, io)
        oproduccionEvents(socket, io)
        productoEvents(socket, io)
        proveedorEvents(socket, io)
        recepcionEvents(socket, io)
        requisicionEvents(socket, io)
        trabajadorEvents(socket,io)
        bobinaEvents(socket, io)
        notificacionesEvents(socket, io)
        tasaEvents(socket, io)
    });

    
}