from flask import request, jsonify
from src.database import execute_query

def register_routes(app):
    """Registra todas las rutas de la API en la aplicación Flask."""
    
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.json
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Por favor proporciona usuario y contraseña"}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        # Consultar si el usuario existe y coincide la contraseña
        user = execute_query(
            "SELECT id, username, role FROM users WHERE username = %s AND password = %s",
            (username, password),
            fetch=True,
            fetch_one=True
        )
        
        if user:
            return jsonify({
                "message": "Login exitoso",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"]
                }
            }), 200
        else:
            return jsonify({"error": "Credenciales incorrectas"}), 401

    @app.route('/api/tasks', methods=['GET'])
    def get_tasks():
        user_id = request.args.get('userId')
        role = request.args.get('role')
        
        if not user_id or not role:
            return jsonify({"error": "Falta userId o role en los parámetros"}), 400
            
        if role == 'admin':
            # Administradores ven todas las tareas y a quién están asignadas
            query = """
                SELECT t.id, t.title, t.description, t.status, t.assigned_to, u.username as assigned_username 
                FROM tasks t 
                JOIN users u ON t.assigned_to = u.id
                ORDER BY t.id DESC
            """
            tasks = execute_query(query, fetch=True)
        else:
            # Usuarios normales ven solo sus tareas
            query = """
                SELECT id, title, description, status, assigned_to 
                FROM tasks 
                WHERE assigned_to = %s
                ORDER BY id DESC
            """
            tasks = execute_query(query, (user_id,), fetch=True)
            
        return jsonify(tasks), 200

    @app.route('/api/tasks', methods=['POST'])
    def create_task():
        data = request.json
        if not data or not data.get('title') or not data.get('assigned_to'):
            return jsonify({"error": "Título y usuario asignado son requeridos"}), 400
            
        title = data.get('title')
        description = data.get('description', '')
        assigned_to = data.get('assigned_to')
        status = data.get('status', 'pending')
        
        try:
            task_id = execute_query(
                "INSERT INTO tasks (title, description, status, assigned_to) VALUES (%s, %s, %s, %s)",
                (title, description, status, assigned_to)
            )
            return jsonify({"message": "Tarea creada con éxito", "id": task_id}), 201
        except Exception as e:
            return jsonify({"error": f"Error al crear tarea: {str(e)}"}), 500

    @app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
    def toggle_task_status(task_id):
        # Obtener el estado actual de la tarea
        task = execute_query("SELECT status FROM tasks WHERE id = %s", (task_id,), fetch=True, fetch_one=True)
        if not task:
            return jsonify({"error": "Tarea no encontrada"}), 404
            
        new_status = 'completed' if task['status'] == 'pending' else 'pending'
        
        try:
            execute_query("UPDATE tasks SET status = %s WHERE id = %s", (new_status, task_id))
            return jsonify({"message": f"Estado de la tarea actualizado a {new_status}", "status": new_status}), 200
        except Exception as e:
            return jsonify({"error": f"Error al actualizar tarea: {str(e)}"}), 500

    @app.route('/api/users', methods=['GET'])
    def get_users():
        # Retorna lista de usuarios para que el admin pueda asignar tareas
        try:
            users = execute_query("SELECT id, username, role FROM users", fetch=True)
            return jsonify(users), 200
        except Exception as e:
            return jsonify({"error": f"Error al obtener usuarios: {str(e)}"}), 500

    @app.route('/api/users', methods=['POST'])
    def create_user():
        data = request.json
        if not data or not data.get('username') or not data.get('password') or not data.get('role'):
            return jsonify({"error": "Todos los campos (username, password, role) son requeridos"}), 400
            
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        
        if role not in ['admin', 'normal']:
            return jsonify({"error": "Rol inválido, debe ser admin o normal"}), 400
            
        try:
            user_id = execute_query(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, password, role)
            )
            return jsonify({"message": "Usuario creado con éxito", "id": user_id}), 201
        except Exception as e:
            # Control de error de duplicado
            if "Duplicate entry" in str(e):
                return jsonify({"error": "El nombre de usuario ya existe"}), 409
            return jsonify({"error": f"Error al crear usuario: {str(e)}"}), 500
