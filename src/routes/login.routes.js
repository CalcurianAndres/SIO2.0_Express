const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { print } = require('pdf-to-printer');


import Usuario from '../models/usuario'
import { SEED, EXP } from '../config'
import verificarToken from '../Auth/autenticacion'

const app = express();

app.post('/api/usuario', async (req, res) => {

    let body = req.body;
    console.log(body)

    try {
        let usuario = new Usuario({
            Nombre: body.Nombre,
            Apellido: body.Apellido,
            Correo: body.Correo,
            Password: bcrypt.hashSync(body.Password, 10),
            Role: body.Role,
            Departamento: body.Departamento
        });

        let savedUsuario = await usuario.save();
        res.status(201).send(savedUsuario);
    } catch (err) {
        console.error('Error al guardar el usuario:', err);
        res.status(500).send({ error: 'Error al guardar el usuario' });
    }

});

app.get('/api/usuario', async (req, res) => {
    try {
        // Excluyendo el campo 'Password' de los resultados
        const usuarios = await Usuario.find().select('-Password').exec();
        res.json(usuarios);
    } catch (err) {
        console.error('Error en la búsqueda de los usuarios:', err);
        res.status(500).send({ error: 'Error en la búsqueda de los usuarios' });
    }
});


app.put('/api/usuario', async (req, res) => {
    try {
        const data = req.body; // Asegúrate de que req.body contenga los datos que esperas

        if (!data._id) {
            return res.status(400).send({ error: 'Falta el ID del usuario' });
        }

        if (data.Password) {
            data.Password = bcrypt.hashSync(data.Password, 10); // Corrige el acceso a data.Password
        }

        const result = await Usuario.findByIdAndUpdate(data._id, data, { new: true });

        if (!result) {
            return res.status(404).send({ error: 'Usuario no encontrado' });
        }

        res.json({ done: true, usuario: result });
    } catch (err) {
        console.error('Error en la actualización de usuarios:', err);
        res.status(500).send({ error: 'Error en la actualización de usuarios' });
    }
});


app.delete('/api/usuario/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).send({ error: 'Falta el ID del usuario' });
        }

        const result = await Usuario.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).send({ error: 'Usuario no encontrado' });
        }

        res.json({ done: true, message: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar el usuario:', err);
        res.status(500).send({ error: 'Error al eliminar el usuario' });
    }
});

app.post('/api/login', async (req, res) => {
    const body = req.body;

    console.log(body)

    try {
        const usuarioDB = await Usuario.findOne({ Correo: body.Correo });

        if (!usuarioDB) {
            console.log('Error en la validacion de correo')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o contraseña incorrectos'
                }
            });
        }

        const passwordValid = await bcrypt.compare(body.Password, usuarioDB.Password);

        if (!passwordValid) {
            console.log('Error en la validacion de contraseña')
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o contraseña incorrectos'
                }
            });
        }

        const token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: EXP });

        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });

    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({
            ok: false,
            err
        });
    }
});

app.get('/api/renew', verificarToken, async (req, res) => {
    try {
        const token = jwt.sign(
            { usuario: req.usuario },
            SEED,
            { expiresIn: EXP }
        );

        res.json({
            ok: true,
            usuario: req.usuario,
            token,
        });
    } catch (err) {
        console.error('Error al renovar el token:', err);
        res.status(500).json({
            ok: false,
            err
        });
    }
});

const PRINT_DIR = 'C:\\prints';
if (!fs.existsSync(PRINT_DIR)) {
    fs.mkdirSync(PRINT_DIR);
}

app.post('/api/print', async (req, res) => {
    try {
        const { pdfBase64, printer, copies } = req.body;

        if (!pdfBase64 || !printer) {
            return res.status(400).send('Datos incompletos');
        }

        const filePath = path.join(
            PRINT_DIR,
            `etiqueta_${Date.now()}.pdf`
        );

        fs.writeFileSync(filePath, Buffer.from(pdfBase64, 'base64'));

        await print(filePath, {
            printer,
            copies: copies || 1,
            silent: true,
            orientation: 'landscape',
        });

        fs.unlinkSync(filePath);

        res.send({ ok: true });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al imprimir');
    }
});


module.exports = app;