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

INSERT INTO licencias(categoria, edad_requerida) values ("Licencia Juvenil Vehículos Particulares",15),("Licencia Juvenil Motociclistas",18),
("Licencia Motociclistas",18),("Licencia Particular",18),("Licencia Pesada",18),("Licencia Pesada-T",21);