import { obtenerTasaActual, guardarTasaManual } from '../src/helpers/tasa';

export default (socket) => {
  socket.on('CLIENTE:TasaActual', async () => {
    try {
      const resultado = await obtenerTasaActual();
      socket.emit('SERVER:TasaActual', resultado);
    } catch (err) {
      console.warn('⚠️ Error en CLIENTE:TasaActual:', err.message);
      socket.emit('SERVER:TasaActual', {
        tasa: null,
        fuente: null,
        fecha: null,
        manual: true,
      });
    }
  });

  socket.on('CLIENTE:guardarTasa', async (data) => {
    try {
      const tasa = data?.tasa;
      if (typeof tasa !== 'number' || tasa <= 0) {
        socket.emit('SERVIDOR:enviaMensaje', {
          mensaje: 'La tasa debe ser un número mayor a cero',
          icon: 'error',
        });
        return;
      }

      const resultado = await guardarTasaManual(tasa);
      socket.emit('SERVER:TasaActual', resultado);
      socket.emit('SERVIDOR:enviaMensaje', {
        mensaje: 'Tasa guardada correctamente',
        icon: 'success',
      });
    } catch (err) {
      console.warn('⚠️ Error en CLIENTE:guardarTasa:', err.message);
      socket.emit('SERVIDOR:enviaMensaje', {
        mensaje: 'No se pudo guardar la tasa',
        icon: 'error',
      });
    }
  });
};
