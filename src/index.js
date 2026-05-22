import app from './app';
import { Server as WebSocketServer } from 'socket.io'
import https from 'https';
import http from 'http';
import {PORT_URI} from './config'
import fs from 'fs';

import sockets from './sockets';
import cors from 'cors';

import { connectDB } from './db'
connectDB();

// Habilitar CORS para todos los orígenes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

// SSL opcional — si no encuentra los certs, cae a HTTP
let server;
try {
  const sslKeyPath = process.env.SSL_KEY || 'c:/certificado/server/server.key';
  const sslCertPath = process.env.SSL_CERT || 'c:/certificado/server/server.crt';
  const sslCaPath = process.env.SSL_CA || 'c:/certificado/ca/mi_ca.pem';
  const privateKey = fs.readFileSync(sslKeyPath, 'utf8');
  const certificate = fs.readFileSync(sslCertPath, 'utf8');
  const ca = fs.readFileSync(sslCaPath, 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
    requestCert: false,
    rejectUnauthorized: false
  };
  server = https.createServer(credentials, app);
  console.log('🔒 Servidor HTTPS inicializado');
} catch (err) {
  console.warn('⚠️ Certificados SSL no encontrados. Usando HTTP.');
  console.warn('   Para usar HTTPS, define SSL_KEY, SSL_CERT, SSL_CA como env vars.');
  server = http.createServer(app);
}

const HttpServer = server.listen(PORT_URI || 3000)
console.log('✅ Server is listening on port: ', PORT_URI || 3000)
const io = new WebSocketServer(HttpServer)
const webPush = require('web-push');
const vapidConfig = require('./Keys/VapidKey');

// Configurar web-push con las claves VAPID
webPush.setVapidDetails(
  'mailto:calcurianandres@gmail.com',
  vapidConfig.publicKey,
  vapidConfig.privateKey
);

// Aumentar el límite para el objeto io o un namespace específico
io.sockets.setMaxListeners(100);
sockets(io)

