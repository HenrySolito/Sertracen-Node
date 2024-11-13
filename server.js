// server.js
const express = require('express');
const path = require('path');
const connection = require('./database'); // Import the database connection


const app = express();
const PORT = 8080;
//Prueba
// Middleware para procesar datos de formularios (para que req.body no esté vacío)
app.use(express.urlencoded({ extended: true })); // Asegúrate de que los datos del formulario sean procesados correctamente
// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


//Servidor de rutas para las vistas -------------------------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/creacion_cita', (req, res) => {
    res.sendFile(path.join(__dirname, 'creacion_cita.html'));
});

app.get('/renovacion_tramite', (req, res) => {
    res.sendFile(path.join(__dirname, 'renovacion_tramite.html'));
});
app.get('/sobre_nosotros', (req, res) => {
    res.sendFile(path.join(__dirname, 'sobre_nosotros.html'));
});
app.get('/primera_cita', (req, res) => {
    res.sendFile(path.join(__dirname, 'primera_cita.html'));
});



//----------------------------------------------------------------------------
// Route to handle buscar_por_dui
app.get('/buscar_por_dui', (req, res) => {
    const dui = req.query.dui;

    // Consultar persona y sus licencias asociadas
    const personaQuery = 'SELECT * FROM persona WHERE dui = ?';
    const licenciasQuery = `
        SELECT al.id_licencia, l.categoria, al.fecha_registro, al.estado
        FROM asignacion_licencia al
        JOIN licencias l ON al.id_licencia = l.id_licencia
        WHERE al.dui = ?
    `;

    // Ejecutar ambas consultas
    connection.query(personaQuery, [dui], (err, personaResults) => {
        if (err) {
            return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }

        if (personaResults.length > 0) {
            connection.query(licenciasQuery, [dui], (err, licenciasResults) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al consultar las licencias' });
                }

                // Calcular la fecha de vencimiento agregando 5 años a cada licencia
                const licenciasConVencimiento = licenciasResults.map(licencia => {
                    const fechaRegistro = new Date(licencia.fecha_registro);
                    const fechaVencimiento = new Date(fechaRegistro);
                    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 5);

                    return {
                        ...licencia,
                        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0] // Formato "YYYY-MM-DD"
                    };
                });

                res.status(200).json({
                    persona: personaResults[0],
                    licencias: licenciasConVencimiento
                });
            });
        } else {
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
    });
});



// Ruta para manejar la creación de una nueva cita
app.post('/registrar_cita', (req, res) => {
    const { dui, tipoLicencia, fechaCita } = req.body;

    if (!dui || !tipoLicencia || !fechaCita) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = 'INSERT INTO citas (dui, tipo, fecha_cita) VALUES (?, ?, ?)';
    connection.query(query, [dui, tipoLicencia, fechaCita], (err, results) => {
        if (err) {
            console.error('Error al registrar la cita:', err);
            return res.status(500).json({ error: 'Error al registrar la cita en la base de datos' });
        }
        res.status(200).json({ message: 'Cita registrada exitosamente' });
    });
});

// Obtener licencia por primera vez y registrar cita 
app.post('/licencia_nuevo', (req, res) => {
    // Verifica si los datos llegan correctamente
    console.log(req.body); // Añade esto para depuración
  
    const { dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico } = req.body;
  
    // Si hay algún campo vacío, puedes hacer una validación aquí antes de continuar
    if (!dui || !nombreCompleto || !telefono || !fechaNacimiento || !tipoSangre || !direccion || !genero || !correoElectronico) {
      return res.send('Por favor, complete todos los campos.');
    }
  
    // Insertar datos en la base de datos
    const query = 'INSERT INTO persona (dui, nombre, telefono, fecha_nacimiento, tipo_sangre, direccion, genero, correo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(query, [dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico], (err, result) => {
      if (err) {
        console.error('Error al guardar los datos: ', err);
        res.send('Hubo un error al guardar los datos.');
      } else {
        res.send('Datos guardados correctamente.');
      }
    });
  });
  

// Start the server
app.listen(8080, () => {
    console.log(`Servidor escuchando en http://localhost:8080`);
});
