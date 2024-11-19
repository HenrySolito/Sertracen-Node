// database.js
const mysql = require('mysql2');

// Conexión 
const connection = mysql.createConnection({
    host: 'localhost',   
    user: 'root',        
    password: 'root',     
    database: 'licencia'  
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
