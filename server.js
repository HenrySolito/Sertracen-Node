// server.js
const express = require('express');
const path = require('path');
const connection = require('./database'); // conexion con la base



const app = express();
const PORT = 8080;

// para que req.body no quede vacio
app.use(express.urlencoded({ extended: true })); 

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


//Rutas para las vistas -------------------------------------------------------
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
app.get('/pago_infraccion', (req, res) => {
    res.sendFile(path.join(__dirname, 'pago_infraccion.html'));
});
app.get('/citas_programadas', (req, res) => {
    res.sendFile(path.join(__dirname, 'citas_programadas.html'));
});

app.get('/api/citas_programadas', (req, res) => {
    const query = `
      SELECT 
        p.nombre, 
        p.dui, 
        p.fecha_nacimiento, 
        p.direccion, 
        p.tipo_sangre, 
        l.categoria AS tipo_licencia,
        al.fecha_registro AS fecha_registro,
        c.fecha_cita,
        al.estado 
        
      FROM persona p 
      INNER JOIN citas c ON c.dui = p.dui
      INNER JOIN asignacion_licencia al ON al.dui = p.dui
      INNER JOIN licencias l ON l.id_licencia = al.id_licencia
      WHERE al.estado = 'Activo'
    `;
    
    connection.query(query, (err, rows) => {
      if (err) {
        console.log('Error en la consulta:', err);
        return res.status(500).send('Error en la consulta');
      }
      res.json(rows);
    });
  });  

//----------------------------------------------------------------------------
// Buscar_por_dui
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

    connection.query(personaQuery, [dui], (err, personaResults) => {
        if (err) {
            console.error("Error en la consulta de persona:", err);
            return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }

        if (personaResults.length > 0) {
            connection.query(licenciasQuery, [dui], (err, licenciasResults) => {
                if (err) {
                    console.error("Error en la consulta de licencias:", err);
                    return res.status(500).json({ error: 'Error al consultar las licencias' });
                }

                // Calcular la fecha de vencimiento (5 años)
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

//Busqueda de infracciones
app.get('/buscar_infracciones', (req, res) => {
    const dui = req.query.dui;

    const query = `
      SELECT 
          ai.id_ai,
          ai.dui,
          i.nombre AS tipo_infraccion,
          i.clasificacion,
          i.tarifa,
          ai.estado,
          ai.fecha_infraccion,
          ai.fecha_vencimiento
      FROM asignacion_infraccion ai
      JOIN infracciones i ON ai.id_infraccion = i.id_infraccion
      WHERE ai.dui = ?
    `;

    connection.query(query, [dui], (err, results) => {
        if (err) {
            console.error("Error al consultar la base de datos:", err);
            res.status(500).json({ error: 'Error al consultar la base de datos' });
        } else if (results.length > 0) {
            res.status(200).json({ infractions: results });
        } else {
            res.status(404).json({ error: 'No se encontraron infracciones para este DUI' });
        }
    });
});
// Obtener licencia por primera vez y registrar cita 
app.post('/licencia_nuevo', (req, res) => {
    const { 
      dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico,
      tipoLicencia, citaTramite 
    } = req.body;
  
    if (!dui || !nombreCompleto || !telefono || !fechaNacimiento || !tipoSangre || !direccion || !genero || !correoElectronico) {
        alert("Por favor completa todos los campos de datos personales.");
        return;
    }
    if (!tipoLicencia || !citaTramite) {
        alert("Por favor completa todos los campos de la cita.");
        return;
    }
  
    const queryPersona = 'INSERT INTO persona (dui, nombre, telefono, fecha_nacimiento, tipo_sangre, direccion, genero, correo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(queryPersona, [dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico], (err, result) => {
        if (err) {
            console.error('Error al guardar los datos: ', err);
            res.send('Hubo un error al guardar los datos.');
        }
    
    const queryCitas = 'INSERT INTO citas (dui, tipo, fecha_cita) VALUES (?, ?, ?)';
    connection.query(queryCitas, [dui, tipoLicencia, citaTramite], (err3, result3) => {
        if (err3) {
            console.error('Error al guardar los datos3: ', err3);
            res.send('Hubo un error al guardar los datos3.');
        }
    const queryAsignacion = 'INSERT INTO asignacion_licencia (dui, id_licencia, vez, fecha_registro, estado) VALUES (?, ?, ?, ?, ?)';
    connection.query(queryAsignacion, [dui, tipoLicencia, 1, citaTramite, 'Activo'], (err4, result4) => {
        if (err4) {
            console.error('Error al guardar los datos4: ', err4);
            res.send('Hubo un error al guardar los datos4.');
        } 
        res.send(`
              <script>
                alert('Se guardaron correctamente');
                window.location.href = "/";
              </script>
            `);
        
        });
      });
    });
});
  
  

//Pagar Infracción
app.post('/pagar_infraccion', (req, res) => {
    const { id_ai } = req.body; // `id_ai` is the ID of the infraction assignment record

    const query = `UPDATE asignacion_infraccion SET estado = 'Pagado' WHERE id_ai = ?`;

    connection.query(query, [id_ai], (err, result) => {
        if (err) {
            console.error("Error al actualizar el estado de la infracción:", err);
            res.status(500).json({ error: 'Error al actualizar la infracción' });
        } else if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Infracción pagada exitosamente' });
        } else {
            res.status(404).json({ error: 'Infracción no encontrada' });
        }
    });
});


// Start the server
app.listen(8080, () => {
    console.log(`Servidor escuchando en http://localhost:8080`);
});
