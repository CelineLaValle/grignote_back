const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    // Utiliser la chaîne de connexion Railway si disponible, sinon utiliser les variables individuelles
    host: process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

module.exports = pool;

