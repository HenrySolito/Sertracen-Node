// database.js
const mysql = require('mysql2');

// Crear una conexión con la base de datos
const connection = mysql.createConnection({
    host: 'localhost',    // Cambia esto si tu base de datos está en otro servidor
    user: 'root',         // Usuario de la base de datos
    password: 'root',     // Contraseña de la base de datos
    database: 'licencia'  // Nombre de la base de datos que quieres usar
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;
