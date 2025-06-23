
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDb, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, '..', 'assets', 'img')));

app.get('/api/projects', (req, res) => {
    const db = getDb();
    const query = `
        SELECT p.ProjectID, p.Title, p.Description, p.CompletionDate,
               p.RepositoryLink, p.DemoLink, p.ImageUrl,
               GROUP_CONCAT(t.TechnologyName, ', ') AS Technologies
        FROM Projects p
        LEFT JOIN ProjectTechnologies pt ON p.ProjectID = pt.ProjectID
        LEFT JOIN Technologies t ON pt.TechnologyID = t.TechnologyID
        GROUP BY p.ProjectID
        ORDER BY p.CompletionDate DESC;
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener proyectos:', err.message);
            return res.status(500).json({ error: err.message });
        }
        const projects = rows.map(row => ({
            ...row,
            Technologies: row.Technologies ? row.Technologies.split(', ') : []
        }));
        res.json(projects);
    });
});


app.use((req, res, next) => {
    res.status(404).send('Ruta de API no encontrada.');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor!');
});

connectDb()
    .then(() => {
      
      
        app.listen(PORT, () => {
            console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
      
      
        console.error('No se pudo conectar a la base de datos o inicializar tablas, la aplicación no se iniciará.', err);
        process.exit(1);
    });