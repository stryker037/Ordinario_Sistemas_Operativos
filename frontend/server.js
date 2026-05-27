const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Ruta comodín para redirigir cualquier otra petición HTML a index.html (o manejar SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor del Frontend corriendo en http://localhost:${PORT}`);
});
