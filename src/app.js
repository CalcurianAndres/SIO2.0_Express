import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors';

const fs = require('fs');
const path = require('path');

const app = express();

// CORS debe ir ANTES de las rutas para que todos los endpoints tengan los headers
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rutas de API (deben ir antes del catch-all)
app.use(require('./routes/index.routes.js'))

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// Catch-all SPA: cualquier ruta no-API sirve index.html (ÚLTIMO)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PRINT_DIR = 'C:\\prints';
if (!fs.existsSync(PRINT_DIR)) {
    fs.mkdirSync(PRINT_DIR);
}

const UPLOAD_DIR = path.join(__dirname, 'uploads');
['empleado', 'producto', 'analisis', 'plan'].forEach(sub => {
    const dir = path.join(UPLOAD_DIR, sub);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

export default app;