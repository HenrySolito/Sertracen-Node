// server.js
const express = require('express');
const path = require('path');
const connection = require('./database'); // Import the database connection

const app = express();
const PORT = 8080;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/creacion_cita', (req, res) => {
    res.sendFile(path.join(__dirname, 'creacion_cita.html'));
});

app.get('/renovacion_tramite', (req, res) => {
    res.sendFile(path.join(__dirname, 'renovacion_tramite.html'));
});

// Route to handle buscar_por_dui
app.get('/buscar_por_dui', (req, res) => {
    const dui = req.query.dui;

    connection.query(
        'SELECT * FROM persona WHERE dui = ?',
        [dui],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: 'Error al consultar la base de datos' });
            } else if (results.length > 0) {
                res.status(200).json({ persona: results[0] });
            } else {
                res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
