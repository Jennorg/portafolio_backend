const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.resolve(__dirname, '..', 'portafolio.db');
let db;

function connectDb() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err.message);
                reject(err);
            } else {
                console.log('Conectado a la base de datos SQLite en:', DB_FILE);
                db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
                    if (pragmaErr) {
                        console.error('Error al habilitar Foreign Keys:', pragmaErr.message);
                    }
                });

                const initSql = `
                  CREATE TABLE IF NOT EXISTS Projects (
                      ProjectID INTEGER PRIMARY KEY AUTOINCREMENT,
                      Title VARCHAR(255) NOT NULL,
                      Description TEXT,
                      CompletionDate DATE,
                      RepositoryLink VARCHAR(255),
                      DemoLink VARCHAR(255),
                      ImageUrl VARCHAR(255)
                  );

                  CREATE TABLE IF NOT EXISTS Technologies (
                      TechnologyID INTEGER PRIMARY KEY AUTOINCREMENT,
                      TechnologyName VARCHAR(100) NOT NULL UNIQUE,
                      IconPath VARCHAR(255)
                  );

                  CREATE TABLE IF NOT EXISTS ProjectTechnologies (
                      ProjectID INTEGER,
                      TechnologyID INTEGER,
                      PRIMARY KEY (ProjectID, TechnologyID),
                      FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE,
                      FOREIGN KEY (TechnologyID) REFERENCES Technologies(TechnologyID) ON DELETE CASCADE
                  );
              `;

                db.exec(initSql, (sqlErr) => {
                    if (sqlErr) {
                        console.error('Error al crear tablas:', sqlErr.message);
                        reject(sqlErr);
                    } else {
                        console.log('Tablas Projects, Technologies y ProjectTechnologies verificadas/creadas.');

                                              db.get(`SELECT COUNT(*) as count FROM Projects`, (countErr, row) => {
                            if (countErr) {
                                console.error('Error al verificar proyectos existentes:', countErr.message);
                                reject(countErr);
                                return;
                            }

                            if (row.count === 0) {                                console.log('Tabla Projects vacía, insertando datos...');
                                const projectsToInsert = [
                                    {
                                        title: "Batalla naval",
                                        description: "Simulacion de el juego batalla naval utilizando React, POO y multihilos",
                                        demoLink: "https://batalla-naval-navy.vercel.app/",
                                        repositoryLink: "https://github.com/tu-usuario/batalla-naval",
                                        imageUrl: "http://localhost:3001/images/Batalla naval.png",
                                        technologies: ["React", "POO", "JavaScript"]
                                    },
                                    {
                                        title: "Landing Pizzería",
                                        description: "Langing page con redireccionamiento a bot desarrollada con html, css y js puro",
                                        demoLink: "https://chat-bot-page-six.vercel.app/",
                                        repositoryLink: "https://github.com/tu-usuario/landing-pizzeria",
                                        imageUrl: "http://localhost:3001/images/Maljut Pizzas.png",
                                        technologies: ["HTML", "CSS", "JavaScript"]
                                    },
                                    {
                                        title: "Website connect education",
                                        description: "Red social para comunicacion entre estudiantes de informatica de la Uneg enfocada en proyectos desarrollados, hecho en React, typeScripth y Nextjs",
                                        demoLink: "https://red-networking-frontend-n1ml.vercel.app/",
                                        repositoryLink: "https://github.com/tu-usuario/connect-education",
                                        imageUrl: "http://localhost:3001/images/Connect Education.png",
                                        technologies: ["React", "TypeScript", "Next.js"]
                                    }
                                ];

                                db.serialize(() => {
                                    projectsToInsert.forEach(project => {
                                        db.run(`INSERT OR IGNORE INTO Projects (Title, Description, DemoLink, RepositoryLink, ImageUrl) VALUES (?, ?, ?, ?, ?)`,
                                            [project.title, project.description, project.demoLink, project.repositoryLink, project.imageUrl],
                                            function(err) {
                                                if (err) {
                                                    console.error(`Error al insertar proyecto ${project.title}:`, err.message);
                                                    return;
                                                }
                                                const projectId = this.lastID;

                                                if (projectId === 0) {                                                    db.get(`SELECT ProjectID FROM Projects WHERE Title = ?`, [project.title], (err, row) => {
                                                        if (err) {
                                                            console.error(`Error al buscar ID de proyecto existente ${project.title}:`, err.message);
                                                            return;
                                                        }
                                                        if (row) {
                                                            insertTechnologiesForProject(row.ProjectID, project.technologies);
                                                        }
                                                    });
                                                } else {                                                    insertTechnologiesForProject(projectId, project.technologies);
                                                }
                                            }
                                        );
                                    });

                                                                      function insertTechnologiesForProject(projectId, technologies) {
                                        if (!technologies || technologies.length === 0) return;

                                        technologies.forEach(techName => {
                                            db.run(`INSERT OR IGNORE INTO Technologies (TechnologyName) VALUES (?)`, [techName], function(err) {
                                                if (err) {
                                                    console.error(`Error al insertar tecnología ${techName}:`, err.message);
                                                    return;
                                                }
                                                const techId = this.lastID;

                                                if (techId === 0) {                                                    db.get(`SELECT TechnologyID FROM Technologies WHERE TechnologyName = ?`, [techName], (err, row) => {
                                                        if (err) {
                                                            console.error(`Error al buscar ID de tecnología existente ${techName}:`, err.message);
                                                            return;
                                                        }
                                                        if (row) {
                                                            db.run(`INSERT OR IGNORE INTO ProjectTechnologies (ProjectID, TechnologyID) VALUES (?, ?)`, [projectId, row.TechnologyID], (err) => {
                                                                if (err) console.error(`Error al enlazar ${projectId} con ${techName}:`, err.message);
                                                            });
                                                        }
                                                    });
                                                } else {                                                    db.run(`INSERT OR IGNORE INTO ProjectTechnologies (ProjectID, TechnologyID) VALUES (?, ?)`, [projectId, techId], (err) => {
                                                        if (err) console.error(`Error al enlazar ${projectId} con ${techName}:`, err.message);
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                                resolve(db);                            } else {
                                console.log('Tabla Projects ya contiene datos, omitiendo inserción de datos');
                                resolve(db);                            }
                        });
                    }
                });
            }
        });
    });
}

function getDb() {
    if (!db) {
        throw new Error('La base de datos no está conectada. Llama a connectDb() primero.');
    }
    return db;
}

module.exports = { connectDb, getDb };