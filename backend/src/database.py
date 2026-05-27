import os
import time
import pymysql

# Obtener credenciales de las variables de entorno
DB_HOST = os.environ.get('DB_HOST', 'database')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_NAME = os.environ.get('DB_NAME', 'taskmanager')
DB_USER = os.environ.get('DB_USER', 'task_user')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'task_password')

def get_db_connection():
    """Establece la conexión a MariaDB con reintentos en caso de que esté iniciando."""
    retries = 10
    connection = None
    for i in range(retries):
        try:
            connection = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                cursorclass=pymysql.cursors.DictCursor
            )
            return connection
        except pymysql.MySQLError as e:
            print(f"Intento {i+1}/{retries}: No se pudo conectar a la base de datos. Reintentando en 2 segundos...")
            print(f"Error: {e}")
            time.sleep(2)
    
    raise Exception("Error: No se pudo conectar a la base de datos MariaDB tras múltiples reintentos.")

def execute_query(query, params=None, fetch=False, fetch_one=False):
    """Ejecuta una consulta SQL y maneja la conexión automáticamente."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                if fetch_one:
                    return cursor.fetchone()
                return cursor.fetchall()
            conn.commit()
            return cursor.lastrowid
    except pymysql.MySQLError as e:
        print(f"Error ejecutando consulta: {query}")
        print(f"Detalle del error: {e}")
        raise e
    finally:
        conn.close()
