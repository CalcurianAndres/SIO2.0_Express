import express from 'express';
import bodyParser from 'body-parser'

const fs = require('fs');
const path = require('path');

const app = express();
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


export default app;