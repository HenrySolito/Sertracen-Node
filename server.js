const express = require('express');
const path = require('path');
const connection = require('./database'); // conexion con la base
const session = require('express-session');
const app = express();
const PORT = 8080;

// para que req.body no quede vacio
app.use(express.urlencoded({ extended: true })); 

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

app.use(session({
    secret: 'clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hora
}));


//Rutas para las vistas -------------------------------------------------------

// Vistas Login y Crear usuario-----------------------------------------------------------
const protectedPages = [
    { route: '/inicio', file: 'inicio.html' },
    { route: '/creacion_cita', file: 'creacion_cita.html' },
    { route: '/renovacion_tramite', file: 'renovacion_tramite.html' },
    { route: '/pago_infraccion', file: 'pago_infraccion.html' },
    { route: '/citas_programadas', file: 'citas_programadas.html' },
    { route: '/sobre_nosotros', file: 'sobre_nosotros.html' },
    { route: '/cita_programada', file: 'cita_programada.html' },
    { route: '/primera_cita', file: 'primera_cita.html'},
    { route: '/infracciones', file: 'infracciones.html'},
];

const publicPages = [
    { route: '/', file: 'index.html' },
    { route: '/crear_usuario', file: 'crear_usuario.html' },
];

// Configurar páginas públicas
publicPages.forEach(page => {
    app.get(page.route, (req, res) => {
        res.sendFile(path.join(__dirname, page.file));
    });
});

// Configurar páginas protegidas (requieren sesión)
protectedPages.forEach(page => {
    app.get(page.route, (req, res) => {
        if (req.session && req.session.user) {
            res.sendFile(path.join(__dirname, page.file));
        } else {
            res.redirect('/');
        }
    });
});

// Configuración de express-session
app.use(session({
    secret: 'mi_secreto',   // Cambia esto por un valor secreto seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Asegúrate de que 'secure: true' si usas HTTPS
  }));

//Crear Usuario------------------------------------------------
app.post('/crear_usuario', (req, res) => {
    const { dui, nombre, telefono, fechaNacimiento, tipoSangre, direccion, genero, correo, contra } = req.body;

    if (!dui || !nombre || !telefono || !fechaNacimiento || !tipoSangre || !direccion || !genero || !correo || !contra) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        
    }

    // Verificar si el DUI ya existe
    const verificarDUIQuery = 'SELECT * FROM persona WHERE dui = ?';
    connection.query(verificarDUIQuery, [dui], (err, results) => {
        if (err) {
            console.error('Error al verificar el DUI:', err);
            return res.status(500).json({ error: 'Error al verificar el DUI.' });
        }

        if (results.length > 0) {
            // Si el DUI ya existe, no se realiza la inserción
            return res.status(400).send(`
              <script>
                alert('El DUI ya está registrado.');
                window.location.href = "/crear_usuario";
              </script>
            `);
        }

        // Si el DUI no existe, realizar la inserción
        const insertarUsuarioQuery = `
            INSERT INTO persona (dui, nombre, telefono, fecha_nacimiento, tipo_sangre, direccion, genero, correo, contra, tipo_usuario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'usuario')
        `;
        connection.query(
            insertarUsuarioQuery,
            [dui, nombre, telefono, fechaNacimiento, tipoSangre, direccion, genero, correo, contra],
            (err2, results2) => {
                if (err2) {
                    console.error('Error al crear usuario:', err2);
                    return res.status(500).json({ error: 'Error al registrar el usuario.' });
                }

                res.status(200).send(`
                  <script>
                    alert('Usuario registrado exitosamente.');
                    window.location.href = "/";
                  </script>
                `);
            }
        );
    });
});



//Ruta para Login------------------------------------------------------
app.post('/login', (req, res) => {
    const { dui, contra } = req.body;

    if (!dui || !contra) {
        return res.status(400).json({ message: 'DUI y contraseña son requeridos' });
    }

    // Modificamos la consulta para la tabla 'persona'
    const query = 'SELECT * FROM persona WHERE dui = ? AND contra = ?';
    connection.query(query, [dui, contra], (err, results) => {
        if (err) {
            console.error('Error en la base de datos:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            // Redirige al `index.html` si las credenciales son correctas
            req.session.user = {
                dui: results[0].dui,
                nombre: results[0].nombre,
                tipoUsuario: results[0].tipo_usuario
            };
            res.status(200).json({message: 'Credenciales Correctas', redirect: '/inicio' });
        } else {
            res.status(401).send(`
                <script>
                    alert('Credenciales incorrectas.');
                    window.location.href = "/";
                </script>
            `);
        }
        
    });
});

//Logout----------------------------------------------------------
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('No se pudo cerrar la sesión');
        }
        res.redirect('/');
    });
});

//---------------------------------------------

//Citas programadas de todos los usuarios para vista Admin
app.get('/api/citas_programadas', (req, res) => {
    const query = `
      SELECT  p.nombre, p.dui, p.fecha_nacimiento, p.direccion, p.tipo_sangre, l.categoria AS tipo_licencia, c.fecha_cita AS fecha_registro,c.fecha_cita, p.genero, 
      p.telefono, (SELECT COUNT(id_infraccion) from asignacion_infraccion ai where p.dui=ai.dui AND ai.dui='No pagado') as infraccion
      FROM persona p 
      INNER JOIN citas c ON c.dui = p.dui
      INNER JOIN licencias l ON l.id_licencia = c.tipo 
      `;
    //  WHERE al.estado = 'Activo'
   // `;
    
    connection.query(query, (err, rows) => {
      if (err) {
        console.log('Error en la consulta:', err);
        return res.status(500).send('Error en la consulta');
      }
      res.json(rows);
    });
  }); 

  
  //Cita programada del usuario para vista Usuario
  app.get('/api/cita_programada', (req, res) => {
    console.log("Sesión del usuario:", req.session.user);
  
    const duiUsuario = req.session.user?.dui;
  
    if (!duiUsuario) {
      return res.status(401).send('No autorizado. El usuario no está logeado.');
    }
    const query = `
      SELECT p.nombre, p.dui, l.categoria AS tipo_licencia, c.fecha_cita, c.id_cita 
      FROM persona p 
      INNER JOIN citas c ON c.dui = p.dui
      INNER JOIN licencias l ON l.id_licencia = c.tipo
      WHERE p.dui = ?
    `;
    //WHERE al.estado = 'Activo' AND 
    
    connection.query(query, [duiUsuario], (err, rows) => {
      if (err) {
        console.log('Error en la consulta:', err);
        return res.status(500).send('Error en la consulta');
      }
      res.json(rows);
    });
  });



//Modificar Cita-------------------------------------------------
app.get('/api/modificar_cita/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM citas WHERE id_cita = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener la cita:', err);
            return res.status(500).json({ error: 'Error al obtener la cita' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.status(200).json({ cita: results[0] });
    });
});


app.post('/api/modificar_cita/:id', (req, res) => {
    const { id } = req.params;
    const { tipoLicencia, fechaCita } = req.body;

    if (!tipoLicencia || !fechaCita) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = 'UPDATE citas SET tipo = ?, fecha_cita = ? WHERE id_cita = ?';
    connection.query(query, [tipoLicencia, fechaCita, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar la cita:', err);
            return res.status(500).json({ error: 'Error al actualizar la cita' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada.' });
        }

        res.status(200).json({ message: 'Cita actualizada exitosamente.' });
    });
});




//Borrar cita-------------------------------------------------
app.delete('/api/cita_programada/:id', (req, res) => {
    const id_cita = req.params.id;

    const query = 'DELETE FROM citas WHERE id_cita = ?';
    connection.query(query, [id_cita], (error, results) => {
        if (error) {
            console.error('Error al eliminar la cita:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        return res.status(200).json({ message: 'Cita eliminada correctamente' });
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
    if (!req.session.user) {
        return res.status(401).send(`
            <script>
                alert('Debe iniciar sesión primero.');
                window.location.href = "/";
            </script>
        `);
    }

    const { tipoLicencia, fechaCita } = req.body;
    const dui = req.session.user.dui; // Obtener el DUI del usuario logeado

    if (!tipoLicencia || !fechaCita) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si existe una licencia asociada al DUI y tipo de licencia
    const buscarLicenciaQuery = 'SELECT * FROM asignacion_licencia WHERE dui = ? AND id_licencia = ?';
    connection.query(buscarLicenciaQuery, [dui, tipoLicencia], (err, results) => {
        if (err) {
            console.error('Error al buscar la licencia:', err);
            return res.status(500).json({ error: 'Error al buscar la licencia en la base de datos' });
        }

        if (results.length > 0) {
            // Si existe, incrementar el campo "vez"
            const licencia = results[0];
            const actualizarLicenciaQuery = 'UPDATE asignacion_licencia SET vez = vez + 1 WHERE id_al = ?';
            connection.query(actualizarLicenciaQuery, [licencia.id_al], (err2) => {
                if (err2) {
                    console.error('Error al actualizar la licencia:', err2);
                    return res.status(500).json({ error: 'Error al actualizar la licencia en la base de datos' });
                }

                // Registrar la cita
                registrarCita(dui, tipoLicencia, fechaCita, res);
            });
        } else {
            // Si no existe, crear una nueva licencia como "Inactiva"
            const crearLicenciaQuery = 'INSERT INTO asignacion_licencia (dui, id_licencia, vez, fecha_registro, estado) VALUES (?, ?, ?, ?, ?)';
            const fechaRegistro = new Date().toISOString().split('T')[0]; // Fecha actual en formato "YYYY-MM-DD"
            connection.query(crearLicenciaQuery, [dui, tipoLicencia, 1, fechaRegistro, 'Inactiva'], (err3) => {
                if (err3) {
                    console.error('Error al crear la licencia:', err3);
                    return res.status(500).json({ error: 'Error al crear la licencia en la base de datos' });
                }

                // Registrar la cita
                registrarCita(dui, tipoLicencia, fechaCita, res);
            });
        }
    });
});

// Función para registrar la cita
function registrarCita(dui, tipoLicencia, fechaCita, res) {
    const query = 'INSERT INTO citas (dui, tipo, fecha_cita) VALUES (?, ?, ?)';
    connection.query(query, [dui, tipoLicencia, fechaCita], (err, results) => {
        if (err) {
            console.error('Error al registrar la cita:', err);
            return res.status(500).json({ error: 'Error al registrar la cita en la base de datos' });
        }

        res.status(200).send(`
            <script>
                alert('Cita registrada exitosamente.');
                window.location.href = "/inicio";
            </script>
        `);
    });
}

//Infracciones del usuario------------------------------------
app.get('/buscar_infracciones', (req, res) => {
    const dui = req.session.user?.dui;
  
    if (!dui) {
      return res.status(401).send('No autorizado. El usuario no está logeado.');
    }

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

//Infracciones del usuario para admin (todos los usuarios)------------------------------------
app.get('/buscar_infracciones_admin', (req, res) => {
    const dui = req.query.dui; 
    if (!dui) { 
        return res.status(400).send('Solicitud incorrecta. El parámetro DUI es requerido.'

        ); 
    }

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
        if (err) { console.error("Error al consultar la base de datos:", err); 
            return res.status(500).json({ error: 'Error al consultar la base de datos' }); 
        } else if (results.length > 0) { 
            return res.status(200).json({ infractions: results }); 
        } else { 
            return res.status(404).json({ error: 'No se encontraron infracciones para este DUI' }); 
        }
    });
});


// Obtener licencia por primera vez y registrar cita 
app.post('/primera_cita', (req, res) => {
    if (!req.session.user) { 
        return res.send(` 
            <script> alert('Debe iniciar sesión primero'); 
            window.location.href = "/"; 
            </script> `); 
        } res.send(` 
            <h1>Bienvenido, usuario con DUI: ${req.session.user.dui}</h1> 
            <a href="/logout">Cerrar sesión</a> `);
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

//Para nav
app.get('/user-info', (req, res) => { 
    const user = req.session.user; 
    if (!user) { 
        return res.status(401).json({ error: 'No autorizado' }); 
    } 
    res.json(user);
 });


// Start the server
app.listen(8080, () => {
    console.log(`Servidor escuchando en http://localhost:8080`);
});
