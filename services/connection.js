const mysql = require('mysql2/promise');
require('dotenv').config();

// Afficher les informations de connexion (sans les mots de passe)
console.log('Tentative de connexion à la base de données:');
console.log('- Host:', process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST || 'non défini');
console.log('- Database:', process.env.DB_NAME || 'non défini');
console.log('- Port:', process.env.DB_PORT || 'non défini');
console.log('- SSL:', process.env.NODE_ENV === 'production' ? 'activé' : 'désactivé');

const pool = mysql.createPool({
    // Utiliser la chaîne de connexion Railway si disponible, sinon utiliser les variables individuelles
    host: process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    // Forcer l'utilisation d'IPv4
    connectTimeout: 10000, // Augmenter le timeout
    family: 4 // Forcer IPv4
});

// Tester la connexion au démarrage
pool.getConnection()
    .then(connection => {
        console.log('✅ Connexion à la base de données établie avec succès');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err);
    });

// Ajouter un gestionnaire d'erreurs pour le pool
pool.on('error', (err) => {
    console.error('Erreur inattendue du pool de connexion:', err);
});

module.exports = pool;

