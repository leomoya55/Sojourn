-- =============================================================
-- Sistema de Gestión Académica — Instituto de Lengua Española
-- Esquema de base de datos + datos de prueba
-- Motor: MySQL / MariaDB (XAMPP)
-- =============================================================

CREATE DATABASE IF NOT EXISTS gestion_academica
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_academica;

-- Asegura que el texto con acentos (í, ó, ñ…) se almacene correctamente.
SET NAMES utf8mb4;

-- Para poder reimportar sin errores, se eliminan en orden inverso de dependencias.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS asistencia;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS estudiante_curso;
DROP TABLE IF EXISTS curso_docente;
DROP TABLE IF EXISTS comunicados;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- Roles del sistema
-- ---------------------------------------------------------------
CREATE TABLE roles (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------
-- Usuarios (administradores, docentes y padres)
-- ---------------------------------------------------------------
CREATE TABLE usuarios (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email    VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id   INT NOT NULL,
    activo   BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------------
-- Cursos
-- ---------------------------------------------------------------
CREATE TABLE cursos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255),
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------
-- Estudiantes
-- ---------------------------------------------------------------
CREATE TABLE estudiantes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    direccion        VARCHAR(255),
    telefono         VARCHAR(30),
    email            VARCHAR(150)
);

-- ---------------------------------------------------------------
-- Relación cursos <-> docentes (muchos a muchos)
-- ---------------------------------------------------------------
CREATE TABLE curso_docente (
    curso_id   INT NOT NULL,
    docente_id INT NOT NULL,
    PRIMARY KEY (curso_id, docente_id),
    CONSTRAINT fk_cd_curso   FOREIGN KEY (curso_id)   REFERENCES cursos(id)   ON DELETE CASCADE,
    CONSTRAINT fk_cd_docente FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Relación estudiantes <-> cursos (muchos a muchos)
-- ---------------------------------------------------------------
CREATE TABLE estudiante_curso (
    estudiante_id INT NOT NULL,
    curso_id      INT NOT NULL,
    PRIMARY KEY (estudiante_id, curso_id),
    CONSTRAINT fk_ec_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ec_curso      FOREIGN KEY (curso_id)      REFERENCES cursos(id)      ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Notas
-- ---------------------------------------------------------------
CREATE TABLE notas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    curso_id      INT NOT NULL,
    nota          DECIMAL(5,2) NOT NULL,
    observacion   VARCHAR(255),
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notas_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_notas_curso      FOREIGN KEY (curso_id)      REFERENCES cursos(id)      ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Asistencia
-- ---------------------------------------------------------------
CREATE TABLE asistencia (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    curso_id      INT NOT NULL,
    fecha         DATE NOT NULL,
    presente      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_asis_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_asis_curso      FOREIGN KEY (curso_id)      REFERENCES cursos(id)      ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Comunicados
-- ---------------------------------------------------------------
CREATE TABLE comunicados (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    titulo             VARCHAR(150) NOT NULL,
    contenido          TEXT NOT NULL,
    autor_id           INT,
    fecha_publicacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_com_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =============================================================
-- DATOS DE PRUEBA
-- =============================================================

-- Roles (los IDs coinciden con frontend/src/utils/roles.js)
INSERT INTO roles (id, nombre) VALUES
    (1, 'administrador'),
    (2, 'docente'),
    (3, 'padre');

-- Usuarios de prueba (contraseñas en texto plano para que las uses al iniciar sesión):
--   admin@instituto.cr   / admin123    (administrador)
--   docente@instituto.cr / docente123  (docente)
--   padre@instituto.cr   / padre123    (padre)
INSERT INTO usuarios (nombre, apellido, email, password, rol_id, activo) VALUES
    ('Leonardo', 'Moya',     'admin@instituto.cr',   '$2a$10$A4waDd7g6e30pHorMVehou6j6Vchzhkjr5a.njfvwN4hA56T9MmE.', 1, TRUE),
    ('María',    'Rodríguez', 'docente@instituto.cr', '$2a$10$sEHzKkyvSUekAxumLom9LO4.T5t6AyV3nyaKUOqqLALp4MtG/e8M6', 2, TRUE),
    ('Carlos',   'Jiménez',   'padre@instituto.cr',   '$2a$10$ocXwF9qlhhewOpw2lTQgOeJeK3/n1uqml.9QykRO4lmKb5u55AItK', 3, TRUE);

-- Cursos
INSERT INTO cursos (nombre, descripcion, activo) VALUES
    ('Español I',    'Lengua española nivel básico',       TRUE),
    ('Matemáticas I', 'Aritmética y fundamentos',          TRUE),
    ('Ciencias I',   'Introducción a las ciencias naturales', TRUE);

-- Estudiantes
INSERT INTO estudiantes (nombre, apellido, fecha_nacimiento, direccion, telefono, email) VALUES
    ('Ana',   'Jiménez', '2014-03-12', 'San Francisco de Dos Ríos', '8888-0001', 'ana.jimenez@correo.cr'),
    ('Luis',  'Mora',    '2013-09-25', 'San José',                  '8888-0002', 'luis.mora@correo.cr'),
    ('Sofía', 'Vargas',  '2014-01-08', 'Curridabat',                '8888-0003', 'sofia.vargas@correo.cr');

-- Asignar docente al curso de Español I (docente = usuario id 2)
INSERT INTO curso_docente (curso_id, docente_id) VALUES (1, 2);

-- Matricular estudiantes en cursos
INSERT INTO estudiante_curso (estudiante_id, curso_id) VALUES
    (1, 1), (1, 2),
    (2, 1),
    (3, 1), (3, 3);

-- Notas de ejemplo
INSERT INTO notas (estudiante_id, curso_id, nota, observacion) VALUES
    (1, 1, 92.00, 'I Trimestre — excelente desempeño'),
    (1, 2, 85.50, 'I Trimestre — buen avance'),
    (2, 1, 68.00, 'I Trimestre — debe reforzar lectura');

-- Asistencia de ejemplo
INSERT INTO asistencia (estudiante_id, curso_id, fecha, presente) VALUES
    (1, 1, '2026-05-04', TRUE),
    (1, 1, '2026-05-05', TRUE),
    (1, 1, '2026-05-06', FALSE),
    (2, 1, '2026-05-04', TRUE),
    (2, 1, '2026-05-05', FALSE);

-- Comunicados (autor = administrador, usuario id 1)
INSERT INTO comunicados (titulo, contenido, autor_id) VALUES
    ('Inicio del curso lectivo', 'Les damos la bienvenida al nuevo período académico 2026.', 1),
    ('Reunión de padres',        'Se convoca a reunión general el viernes a las 5:00 p.m.', 1);
