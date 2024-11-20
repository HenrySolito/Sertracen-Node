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
    secret: 'clave_secreta', // Cambia esta clave por una más segura
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
    { route: '/cita_programada', file: 'cita_programada.html' }
];

const publicPages = [
    { route: '/', file: 'index.html' },
    { route: '/crear_usuario', file: 'crear_usuario.html' },
    { route: '/registro', file: 'registro.html' }
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
                    window.location.href = "/login";
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


app.get('/api/citas_programadas', (req, res) => {
    const query = `
      SELECT  p.nombre, p.dui, p.fecha_nacimiento, p.direccion, p.tipo_sangre, l.categoria AS tipo_licencia, 
      al.fecha_registro AS fecha_registro,c.fecha_cita,al.estado  
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
  
// Registro
app.post('/registro', (req, res) => {
    const { 
      dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico, password} = req.body;
  
    const queryPersona = 'INSERT INTO persona (dui, nombre, telefono, fecha_nacimiento, tipo_sangre, direccion, genero, correo, contra, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(queryPersona, [dui, nombreCompleto, telefono, fechaNacimiento, tipoSangre, direccion, genero, correoElectronico, password, 'user'], (err, result) => {
        if (err) {
            console.error('Error al guardar los datos: ', err);
            res.send('Hubo un error al guardar los datos.');
        }

        res.send(`
              <script>
                alert('Se guardaron correctamente');
                window.location.href = "/login";
              </script>
            `);
        
    });
});
/*Revisar si funciona la session
app.use(bodyParser.urlencoded({ extended: true })); 
// Configura el middleware de sesión 
app.use(session({ 
    secret: 'tu_secreto', 
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false } // Usa true si estás usando HTTPS 
    }));

//Login
app.post('/login',(req,res) =>{
    const { dui, password } = req.body; 
    const queryPersona = 'SELECT * FROM persona WHERE dui = ? AND contra = ?'; 
    connection.query(queryPersona, [dui, password], (err, results) => { 
        if (err) { 
            return res.status(500).json({ error: 'Error al consultar la base de datos' }); 
        } 
        if (results.length > 0) { 
            // Inicia la sesión y guarda el DUI en la sesión 
            req.session.user = { dui: results[0].dui }; 
            res.send(` 
                <script> 
                alert('Inicio de sesión exitoso'); 
                window.location.href = "/primera_cita"; 
                </script> `); 
            } else { 
                res.send(` 
                    <script> 
                    alert('Usuario o contraseña incorrectos'); 
                    </script> `); 
            }
    });
});

// Ruta para cerrar sesión 
app.get('/logout', (req, res) => { 
    req.session.destroy((err) => { 
        if (err) { 
            return res.status(500).json({ error: 'Error al cerrar sesión' }); 
        } 
        res.send(` 
            <script> alert('Sesión cerrada correctamente'); 
            window.location.href = "/"; 
            </script> `); 
        }); 
    });*/

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
