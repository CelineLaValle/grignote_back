const mysql = require('mysql2/promise');

const connection = async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        });
        console.log('Connecté à la base de données');
        return conn;
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error);
        throw error;
    }
};

module.exports = connection;
