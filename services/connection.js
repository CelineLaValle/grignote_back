const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true, // Attendre qu'une connexion se libère si le pool est plein
    connectionLimit: 10,  // limite de connexions simultanées
    queueLimit: 0  // 0 = aucune limite pour les requêtes en attente
});

module.exports = pool;