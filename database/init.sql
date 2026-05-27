-- Usar la base de datos creada por las variables de entorno de MariaDB
USE taskmanager;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'normal'))
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    assigned_to INT NOT NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar usuarios iniciales
INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('user1', 'user123', 'normal'),
('user2', 'user223', 'normal')
ON DUPLICATE KEY UPDATE username=username;

-- Insertar tareas de prueba iniciales
-- Nota: admin tiene id 1, user1 tiene id 2, user2 tiene id 3
INSERT INTO tasks (title, description, status, assigned_to) VALUES 
('Instalar Docker', 'Instalar Docker Desktop en la máquina local para habilitar contenedores.', 'completed', 2),
('Configurar MariaDB', 'Definir el script init.sql y estructurar las tablas iniciales del proyecto.', 'pending', 2),
('Diseñar Interfaz Frontend', 'Crear el diseño minimalista moderno con modo oscuro y acentos azules.', 'pending', 3)
ON DUPLICATE KEY UPDATE title=title;
