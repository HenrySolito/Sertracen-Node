CREATE DATABASE licencia;
USE licencia;

CREATE TABLE persona(
    dui VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    tipo_sangre VARCHAR (10),
    direccion VARCHAR(100),
    genero CHAR,
    correo VARCHAR(50)
);

CREATE TABLE licencias (
    id_licencia INT PRIMARY KEY AUTO_INCREMENT,
    categoria VARCHAR(100),
    edad_requerida INT
);


CREATE TABLE asignacion_licencia (
    id_al INT PRIMARY KEY AUTO_INCREMENT,
    dui VARCHAR(10),
    id_licencia INT,
    vez INT,
    estado VARCHAR(10),
    fecha_registro DATE, 
    FOREIGN KEY (dui) REFERENCES persona(dui),
    FOREIGN KEY (id_licencia) REFERENCES licencias(id_licencia)
);

CREATE TABLE infracciones (
    id_infraccion INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    clasificacion VARCHAR(10),
    tarifa DOUBLE
);

CREATE TABLE asignacion_infraccion (
    id_ai INT PRIMARY KEY AUTO_INCREMENT,
    dui VARCHAR(10),
    id_infraccion INT,
    estado ENUM('Pagado','No pagado'),
    fecha_infraccion DATE,
    fecha_vencimiento DATE,
    FOREIGN KEY (dui) REFERENCES persona(dui),
    FOREIGN KEY (id_infraccion) REFERENCES infracciones(id_infraccion)
);

CREATE TABLE citas (
    id_cita INT PRIMARY KEY AUTO_INCREMENT,
    dui VARCHAR(10),
    tipo INT, 
    fecha_cita DATETIME,
    FOREIGN KEY (dui) REFERENCES persona(dui)
);
-- Listado de licencias
INSERT INTO licencias(categoria, edad_requerida) values 
("Licencia Juvenil Vehículos Particulares",15),
("Licencia Juvenil Motociclistas",15),
("Licencia Motociclistas",18),
("Licencia Particular",18),
("Licencia Pesada",18),
("Licencia Pesada-T",21);

ALTER TABLE persona ADD COLUMN tipo_usuario VARCHAR(10);
ALTER TABLE persona ADD COLUMN contra VARCHAR(20);
-- Listado de infracciones
INSERT INTO infracciones (nombre, clasificacion, tarifa) VALUES
('Estacionarse en lugar prohibido', 'Leve', 11.43),
('No portar licencia de conducir', 'Grave', 34.29),
('Conducir con las luces apagadas en la noche', 'Grave', 34.29),
('Conducir bajo efectos de alcohol', 'Muy Grave', 57.14),
('Pasar un semáforo en rojo', 'Muy Grave', 57.14),
('No respetar señales de tránsito', 'Grave', 34.29),
('Usar el teléfono celular mientras conduce', 'Grave', 34.29),
('No usar el cinturón de seguridad', 'Leve', 11.43),
('Sobrepasar el límite de velocidad', 'Muy Grave', 57.14),
('Conducir un vehículo sin placas', 'Grave', 34.29),
('Transportar exceso de pasajeros', 'Grave', 34.29),
('Circular en contravía', 'Muy Grave', 57.14),
('Estacionarse en zona para discapacitados', 'Muy Grave', 57.14),
('No detenerse ante un paso peatonal', 'Grave', 34.29);