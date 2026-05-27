// URL base de la API del Backend ( Flask corriendo en el puerto 5000 )
const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Detectar en qué página estamos
    const loginForm = document.getElementById('login-form');
    const dashboardGrid = document.getElementById('dashboard-grid');

    if (loginForm) {
        initLoginPage();
    } else if (dashboardGrid) {
        initDashboardPage();
    }
});

// ==========================================
// LÓGICA DE LA PÁGINA DE LOGIN
// ==========================================
function initLoginPage() {
    // Si ya hay una sesión activa, ir al dashboard
    if (localStorage.getItem('user')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const alertBox = document.getElementById('login-alert');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        showAlert(alertBox, false); // Ocultar alertas previas

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar usuario en localStorage para persistir sesión en el navegador
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                showAlert(alertBox, true, data.error || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Error de login:', error);
            showAlert(alertBox, true, 'Error al conectar con el backend. Verifica que el servidor esté activo.');
        }
    });
}

// ==========================================
// LÓGICA DEL PANEL DE CONTROL (DASHBOARD)
// ==========================================
async function initDashboardPage() {
    const userString = localStorage.getItem('user');
    
    // Si no está autenticado, redirigir al login
    if (!userString) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userString);
    
    // Configurar información de usuario en navbar
    document.getElementById('user-display-name').textContent = user.username;
    
    const roleBadge = document.getElementById('user-role-badge');
    roleBadge.textContent = user.role.toUpperCase();
    
    if (user.role === 'admin') {
        roleBadge.className = 'user-badge badge-admin';
        document.getElementById('admin-panel').style.display = 'block';
        document.querySelector('main .panel-title').firstChild.textContent = 'Control de Tareas (Global) ';
        
        // Habilitar formularios de administración
        initAdminForms();
        loadAssignees();
    } else {
        roleBadge.className = 'user-badge badge-normal';
        document.getElementById('dashboard-grid').classList.add('normal-user');
    }

    // Configurar botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Cargar tareas iniciales
    loadTasks(user.id, user.role);
}

// Cargar y mostrar tareas
async function loadTasks(userId, role) {
    const container = document.getElementById('tasks-container');
    const countSpan = document.getElementById('task-count');
    
    try {
        const response = await fetch(`${API_URL}/tasks?userId=${userId}&role=${role}`);
        if (!response.ok) throw new Error('Error al obtener tareas');
        
        const tasks = await response.json();
        countSpan.textContent = tasks.length;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay tareas registradas.</div>';
            return;
        }

        container.innerHTML = '';
        tasks.forEach(task => {
            const isCompleted = task.status === 'completed';
            const card = document.createElement('div');
            card.className = 'task-card';
            
            // Si es admin, mostrar a quién está asignada la tarea
            const assignmentInfo = role === 'admin' 
                ? `<span class="task-assigned">Asignado a: <strong>${task.assigned_username || 'Desconocido'}</strong></span>` 
                : '';

            card.innerHTML = `
                <div class="task-content">
                    <h3 class="task-title ${isCompleted ? 'text-completed' : ''}">${escapeHTML(task.title)}</h3>
                    <p class="task-desc">${escapeHTML(task.description || 'Sin descripción.')}</p>
                    <div class="task-meta">
                        <span class="task-status-tag ${isCompleted ? 'tag-completed' : 'tag-pending'}">
                            ${isCompleted ? 'Completado' : 'Pendiente'}
                        </span>
                        ${assignmentInfo}
                    </div>
                </div>
                <div class="task-actions">
                    <label class="checkbox-container">
                        <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTask(${task.id}, ${userId}, '${role}')">
                        <span class="checkmark"></span>
                    </label>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        container.innerHTML = '<div class="empty-state" style="color: var(--danger)">Error al cargar tareas de la base de datos.</div>';
    }
}

// Cambiar estado de tarea
async function toggleTask(taskId, userId, role) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        
        if (response.ok) {
            // Recargar tareas para reflejar los cambios
            loadTasks(userId, role);
        } else {
            console.error('No se pudo actualizar la tarea');
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
    }
}

// Cargar usuarios en el select de asignación (solo Admin)
async function loadAssignees() {
    const select = document.getElementById('task-assignee');
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const users = await response.json();
        
        // Mantener la primera opción por defecto
        select.innerHTML = '<option value="" disabled selected>Selecciona un usuario</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.role})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar usuarios asignados:', error);
    }
}

// Inicializar formularios del Administrador
function initAdminForms() {
    const userForm = document.getElementById('create-user-form');
    const taskForm = document.getElementById('create-task-form');
    
    const userAlert = document.getElementById('user-alert');
    const taskAlert = document.getElementById('task-alert');
    
    const loggedUser = JSON.parse(localStorage.getItem('user'));

    // Crear Usuario
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value.trim();
        const role = document.getElementById('new-role').value;

        showAlert(userAlert, false);

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const data = await response.json();

            if (response.ok) {
                showAlert(userAlert, true, 'Usuario registrado con éxito', 'alert-success');
                userForm.reset();
                // Actualizar el dropdown de asignados
                loadAssignees();
            } else {
                showAlert(userAlert, true, data.error || 'Error al registrar usuario');
            }
        } catch (error) {
            showAlert(userAlert, true, 'Error al conectar con el servidor.');
        }
    });

    // Crear Tarea
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-desc').value.trim();
        const assigned_to = document.getElementById('task-assignee').value;

        showAlert(taskAlert, false);

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, assigned_to })
            });
            const data = await response.json();

            if (response.ok) {
                showAlert(taskAlert, true, 'Tarea creada y asignada', 'alert-success');
                taskForm.reset();
                // Recargar el listado de tareas globales
                loadTasks(loggedUser.id, loggedUser.role);
            } else {
                showAlert(taskAlert, true, data.error || 'Error al crear tarea');
            }
        } catch (error) {
            showAlert(taskAlert, true, 'Error al conectar con el servidor.');
        }
    });
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function showAlert(element, show, message = '', typeClass = 'alert-danger') {
    if (show) {
        element.textContent = message;
        element.className = `alert ${typeClass}`;
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
