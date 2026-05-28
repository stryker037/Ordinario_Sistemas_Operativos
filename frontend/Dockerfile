# Descarga la imagen de alpine de docker hub
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia la lista de librerías a instalar
COPY package.json .

# corre el comando de instalar las librerías 
RUN npm install

# Copia todo el código fuente
COPY . .

# Expone el puerto 3000
EXPOSE 3000

# Inicia el proceso del servidor de js el front end
CMD ["node", "server.js"]
