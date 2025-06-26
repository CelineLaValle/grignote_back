const mysql = require('mysql2');

const connection = () => {
    try {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: ptrocess.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        });

        connection.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à la base de données:', err);
            } else {
                console.log('Connecté à la base de données');
            }
        });

        return connection;
    } catch (error) {
        console.log(error);
    }
};

module.exports = connection;