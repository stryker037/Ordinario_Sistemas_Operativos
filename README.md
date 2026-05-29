# Proyecto Integrador Ordinario - Sistemas Operativos

## Datos del Alumno
* **Nombre Completo:** Leonardo Salgado López
* **Materia:** Sistemas Operativos
* **Semestre:** 2do Semestre
* **Proyecto:** Plataforma Containerizada Multi-Servicio (Gestor de Tareas "TeamTasks")

---

## 1. Instrucciones de Ejecución

Sigue estos comandos desde tu terminal en VScode (o igual PowerShell, Bash o CMD) en la raíz del proyecto para desplegar los servicios:

### Requisitos Previos
* Tener instalado y en ejecución [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Paso 1: Levantar la Infraestructura
Ejecuta el siguiente comando para construir las imágenes locales y levantar todos los servicios en segundo plano:
```bash
docker compose up -d
```
*El parámetro `-d` levanta los contenedores en modo detached (segundo plano).*

### Paso 2: Verificar el Estado del Despliegue (OPCIONAL)
Verifica que los tres contenedores estén corriendo de forma correcta:
```bash
docker compose ps
```
Deberías ver listados los contenedores `task_frontend`, `task_backend` y `task_db` en estado **Up**.

### Paso 3: Monitorear Logs (OPCIONAL)
Si deseas comprobar que el backend se conectó correctamente a la base de datos o verificar logs de consola:
```bash
docker compose logs -f backend
```

### Paso 4: Probar la Aplicación
1. Abre tu navegador web e ingresa a: **`http://localhost:3000`**
2. Inicia sesión con cualquiera de las siguientes credenciales precargadas:
   * **Administrador**:
     * **Usuario:** `admin`
     * **Contraseña:** `admin123`
   * **Usuario Normal**:
     * **Usuario:** `user1`
     * **Contraseña:** `user123`
3. Probar la aplicación como administrador y como usuario normal (OPCIONAL)
   * **Administrador**:
      * Puedes añadir nuevos usuarios como crear nuevas tareas o modificar el estado de las existentes
   * **Usuario**:
      * Puedes modificar el estado de tus tareas asignadas

### Paso 5: Apagar y Limpiar (OPCIONAL)
Para detener y eliminar los contenedores sin perder la información guardada:
```bash
docker compose down
```
*Gracias al volumen mapeado en el archivo `docker-compose.yml`, los datos y tareas que hayas creado persistirán incluso si apagas o eliminas los contenedores. En caso de querer eliminar los volúmenes creados, utiliza el comando `docker compose down -v`*

---

## 2. Explicación de la Arquitectura

El proyecto implementa una arquitectura desacoplada de 3 capas (Three-Tier Architecture) completamente containerizada mediante contenedores independientes de Docker coordinados por Docker Compose:

1. **frontend**:
   - Frontend hecho en Node.js
   - Tiene dentro su propio `dockerfile`
   - Sirve archivos estáticos (HTML, CSS y JavaScript del lado del cliente).
   - Se comunica con el backend mediante peticiones HTTP asíncronas (Fetch API) enviando y recibiendo datos estructurados en formato JSON.
   
2. **backend**:
   - Backend hecho con Python & Flask
   - Tiene dentro su propio `dockerfile`
   - Actúa como intermediario seguro entre la interfaz del usuario y la base de datos (evitando que el frontend se conecte directamente a MariaDB).
   - Procesa la lógica de autenticación (Login), filtrado de tareas por rol (Admin vs Normal) y registro de recursos.
   
3. **database**:
   - Base de datos MariaDB
   - Contenedor oficial que almacena la información persistente.
   - Contiene la estructura relacional de usuarios y tareas (`users` y `tasks`).
   - Se alimenta inicialmente mediante el script SQL ubicado en `database/init.sql` durante el primer arranque.

4. **docker-compose**
   - Archivo donde se encuentran los servicios a levantar con el comando docker compose up -d

### Flujo de Comunicación y Redes

```
[ Cliente / Navegador ] 
       │ 
       ▼ (Puerto 3000)
┌──────────────────────┐
│  Frontend (Node)     │
└──────────────────────┘
       │ 
       ▼ (Petición Fetch en Puerto 5000)
┌──────────────────────┐
│  Backend (Flask)     │
└──────────────────────┘
       │ 
       ▼ (Puerto 3306 - Interno)
┌──────────────────────┐
│  Database (MariaDB)  │ <─── [Volumen Persistente: mariadb_data]
└──────────────────────┘
```

* **Aislamiento**: Los contenedores operan dentro de una red interna aislada de tipo puente (`app-network`). El contenedor de la base de datos no expone puertos al exterior por motivos de seguridad; solo es accesible por el contenedor del backend dentro de la red privada de Docker.

---

## 3. Puertos Utilizados

| Servicio | Tecnología | Puerto Interno (Contenedor) | Puerto Externo (Host) | Notas / Acceso |
| :--- | :--- | :---: | :---: | :--- |
| **Frontend** | Node.js / Express | `3000` | `3000` | URL de acceso en navegador: `http://localhost:3000` |
| **Backend** | Python Flask | `5000` | `5000` | API REST expuesta para las llamadas del cliente |
| **Database** | MariaDB | `3306` | *No expuesto* | Solo accesible internamente por el servicio `backend` |
