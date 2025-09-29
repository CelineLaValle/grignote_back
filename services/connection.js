const mysql = require('mysql2/promise');
require('dotenv').config();

// Afficher les informations de connexion
console.log('Tentative de connexion à la base de données:');
console.log('- MYSQL_URL présent:', process.env.MYSQL_URL ? 'Oui' : 'Non');
console.log('- MYSQLHOST présent:', process.env.MYSQLHOST ? 'Oui' : 'Non');

// Fonction pour créer le pool de connexion
function createConnectionPool() {
  // Si MYSQL_URL est disponible (format Railway)
  if (process.env.MYSQL_URL) {
    console.log('Utilisation de MYSQL_URL pour la connexion');
    return mysql.createPool(process.env.MYSQL_URL);
  }
  
  // Utiliser les variables Railway si disponibles
  if (process.env.MYSQLHOST) {
    console.log('Utilisation des variables Railway pour la connexion');
    return mysql.createPool({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      connectTimeout: 20000
    });
  }
  
  // Fallback sur les variables DB_*
  console.log('Utilisation des variables DB_* pour la connexion');
  return mysql.createPool({
    host: process.env.DB_HOST,
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
    connectTimeout: 20000
  });
}

const pool = createConnectionPool();

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

