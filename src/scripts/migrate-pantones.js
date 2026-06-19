/**
 * Script de migración: Excel Pantone → MongoDB
 * 
 * Lee el archivo PANTONE SOLID COATED CODE LIST.xlsx de la raíz del proyecto,
 * normaliza los datos e inserta 1,341 colores Pantone en la colección `pantones`.
 * 
 * Uso: npx babel-node src/scripts/migrate-pantones.js
 * 
 * Dependencias: xlsx (npm install xlsx)
 */

import mongoose from 'mongoose';
import XLSX from 'xlsx';
import path from 'path';

// Configurar conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SIO';

// Schema simplificado para el script (sin validaciones de Mongoose)
const pantoneSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  hex: { type: String, unique: true },
  r: Number,
  g: Number,
  b: Number,
}, {
  timestamps: true,
  collection: 'pantones'
});

const Pantone = mongoose.model('Pantone', pantoneSchema);

async function migrate() {
  console.log('📂 Leyendo PANTONE SOLID COATED CODE LIST.xlsx...');
  
  // Ruta al archivo Excel (raíz del proyecto SIO, no del backend)
  const excelPath = path.resolve(__dirname, '../../../PANTONE SOLID COATED CODE LIST.xlsx');
  
  try {
    // Verificar que el archivo existe
    const fs = require('fs');
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Archivo no encontrado en: ${excelPath}`);
    }

    // Leer archivo Excel
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📄 Hoja: ${sheetName}`);
    console.log(`📊 Rango de datos: ${worksheet['!ref']}`);

    // Primero, leer sin range para ver la estructura
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\n🔍 Primeras 10 filas del Excel:`);
    allData.slice(0, 10).forEach((row, i) => {
      console.log(`  Fila ${i}: ${JSON.stringify(row)}`);
    });

    // Detectar automáticamente dónde empiezan los datos
    // Buscar la primera fila que tenga 5 columnas y la primera sea un string
    let startRow = 0;
    for (let i = 0; i < Math.min(20, allData.length); i++) {
      const row = allData[i];
      if (row && row.length >= 5 && typeof row[0] === 'string' && row[0].includes('C')) {
        startRow = i;
        break;
      }
    }

    console.log(`\n✅ Datos detectados empezando en fila ${startRow}`);

    // Parsear datos desde la fila detectada
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      range: startRow,
      header: ['CODE', 'HEX', 'R', 'G', 'B']
    });

    console.log(`📊 ${rawData.length} registros encontrados en el Excel`);
    console.log('\n🔍 Primeros 5 registros parseados:');
    rawData.slice(0, 5).forEach((row, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(row)}`);
    });

    console.log('\n🔄 Normalizando datos...');

    // Normalizar cada registro
    const pantones = rawData
      .filter(row => row.CODE && row.HEX != null) // Filtrar filas vacías (HEX puede ser 0)
      .map(row => {
        const hexStr = String(row.HEX).toUpperCase().padStart(6, '0');
        return {
          code: String(row.CODE).trim(),
          hex: hexStr,
          r: Number(row.R),
          g: Number(row.G),
          b: Number(row.B)
        };
      })
      .filter(p => {
        // Validar que los datos sean correctos
        const validCode = p.code.length > 0;
        const validHex = /^[0-9A-F]{6}$/.test(p.hex);
        const validRgb = p.r >= 0 && p.r <= 255 && p.g >= 0 && p.g <= 255 && p.b >= 0 && p.b <= 255;
        
        if (!validCode || !validHex || !validRgb) {
          console.log(`  ⚠️  Registro inválido: ${JSON.stringify(p)}`);
        }
        
        return validCode && validHex && validRgb;
      });

    console.log(`\n✅ ${pantones.length} registros normalizados correctamente`);

    if (pantones.length === 0) {
      throw new Error('No se encontraron registros válidos para insertar');
    }

    // Conectar a MongoDB
    console.log('\n🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección antes de insertar (opcional, para pruebas)
    // await Pantone.deleteMany({});
    // console.log('🗑️  Colección limpiada');

    // Insertar documentos (ordered: false para ignorar duplicados)
    console.log('📦 Insertando en MongoDB...');
    
    try {
      const result = await Pantone.insertMany(pantones, { ordered: false });
      console.log(`✅ ${result.length} Pantones insertados correctamente`);
    } catch (err) {
      // Manejar errores de duplicados (código 11000)
      if (err.code === 11000) {
        const inserted = err.result?.nInserted || err.insertedCount || 0;
        const duplicates = pantones.length - inserted;
        console.log(`✅ ${inserted} Pantones insertados correctamente (${duplicates} duplicados omitidos)`);
      } else {
        throw err;
      }
    }

    // Verificar total en la base de datos
    const total = await Pantone.countDocuments();
    console.log(`\n📊 Total de Pantones en la base de datos: ${total}`);

    if (total === 0) {
      console.error('❌ ADVERTENCIA: La colección está vacía después de la migración');
    }

  } catch (err) {
    console.error('\n❌ Error durante la migración:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    // Cerrar conexión
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\n🔌 Conexión cerrada');
    }
    process.exit(0);
  }
}

// Ejecutar migración
migrate();
