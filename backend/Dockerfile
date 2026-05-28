# Agarra la imagen de python para el backend
FROM python:3.9-slim

# Establece el directorio de trabajo de la aplicación
WORKDIR /app

# Copya las librerías necesarias dentro del "requirements.txt"
COPY requirements.txt .

# Instala sin cache de forma recursiva todas las librerías de la lista
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el codigo fuente del proyecto al espacio aislado del contenedor
COPY . .

#Expone el puerto 5000
EXPOSE 5000

#Aplica el último comando para iniciar el proceso en el servidor Flask
CMD ["python", "app.py"]
