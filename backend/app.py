from flask import Flask
from flask_cors import CORS
from src.routes import register_routes

app = Flask(__name__)
# Habilitar CORS para permitir que el frontend se comunique con la API del backend
CORS(app)

# Registrar las rutas en la aplicación
register_routes(app)

if __name__ == '__main__':
    # Escuchar en todas las interfaces de red (0.0.0.0) en el puerto 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
