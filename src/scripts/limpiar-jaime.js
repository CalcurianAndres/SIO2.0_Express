import mongoose from 'mongoose';
import { connectDB } from '../db';
import Trabajador from '../models/trabajador';
import Contratacion from '../models/contrataciones';
import Departamento from '../models/departamento';
import Cargo from '../models/cargo';

const limpiarJaime = async () => {
  try {
    await connectDB();

    // Buscar trabajador
    const trabajador = await Trabajador.findOne({
      'datos_personales.nombres': 'Jaime Jesús',
      'datos_personales.apellidos': 'San Juan Matute',
    });

    if (!trabajador) {
      console.log('❌ No se encontró a Jaime Jesús San Juan Matute');
      process.exit(1);
    }

    console.log('✅ Trabajador encontrado:', trabajador._id.toString());

    // Buscar departamento Operaciones
    const departamento = await Departamento.findOne({ nombre: 'Operaciones' });
    if (!departamento) {
      console.log('❌ No se encontró el departamento Operaciones');
      process.exit(1);
    }

    // Buscar cargo Operador de Impresión
    const cargo = await Cargo.findOne({ nombre: 'Operador de Impresión' });
    if (!cargo) {
      console.log('❌ No se encontró el cargo Operador de Impresión');
      process.exit(1);
    }

    console.log('✅ Departamento:', departamento._id.toString());
    console.log('✅ Cargo:', cargo._id.toString());

    // Eliminar historial de contrataciones
    const eliminadas = await Contratacion.deleteMany({ trabajador: trabajador._id });
    console.log(`🗑️  Contrataciones eliminadas: ${eliminadas.deletedCount}`);

    // Crear nueva contratación única y activa
    const nuevaContratacion = new Contratacion({
      fecha: new Date('2021-04-27T00:00:00Z'),
      departamento: departamento._id,
      cargo: cargo._id,
      de: null,
      sueldo: '300',
      tasa: 5,
      activo: true,
      trabajador: trabajador._id,
    });

    await nuevaContratacion.save();
    console.log('✅ Nueva contratación creada:', nuevaContratacion._id.toString());

    // Actualizar subdocumento del trabajador
    trabajador.contratacion = {
      fecha: nuevaContratacion.fecha,
      departamento: nuevaContratacion.departamento,
      cargo: nuevaContratacion.cargo,
      de: nuevaContratacion.de,
      sueldo: nuevaContratacion.sueldo,
      tasa: nuevaContratacion.tasa,
    };

    await trabajador.save();
    console.log('✅ Trabajador actualizado correctamente');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

limpiarJaime();
