const mysql = require('mysql2/promise');
require('dotenv').config();

// Afficher les informations de connexion (sans les mots de passe)
console.log('Tentative de connexion à la base de données:');

// Fonction pour déterminer les paramètres de connexion
function getConnectionConfig() {
  // En environnement local
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('Mode: développement local');
    return {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grignote',
      port: process.env.DB_PORT || 3306,
      ssl: false
    };
  }
  
  // En production (Railway)
  console.log('Mode: production (Railway)');
  return {
    host: process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

const config = getConnectionConfig();
console.log('- Host:', config.host || 'non défini');
console.log('- Database:', config.database || 'non défini');
console.log('- Port:', config.port || 'non défini');
console.log('- SSL:', config.ssl ? 'activé' : 'désactivé');

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000
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

module.exports = pool;