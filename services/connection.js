const mysql = require('mysql2/promise');
require('dotenv').config();

// Afficher les informations de connexion (sans les mots de passe)
console.log('Tentative de connexion à la base de données:');

// Afficher toutes les variables d'environnement liées à MySQL pour le débogage
console.log('Variables d\'environnement disponibles:');
console.log('- MYSQL_URL présent:', process.env.MYSQL_URL ? 'Oui' : 'Non');
console.log('- MYSQLHOST présent:', process.env.MYSQLHOST ? 'Oui' : 'Non');
console.log('- MYSQLDATABASE présent:', process.env.MYSQLDATABASE ? 'Oui' : 'Non');
console.log('- DB_HOST présent:', process.env.DB_HOST ? 'Oui' : 'Non');
console.log('- DB_NAME présent:', process.env.DB_NAME ? 'Oui' : 'Non');
console.log('- RAILWAY_PRIVATE_DOMAIN présent:', process.env.RAILWAY_PRIVATE_DOMAIN ? 'Oui' : 'Non');

// Fonction pour créer le pool de connexion
function createConnectionPool() {
  // En environnement local
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('Mode: développement local');
    return mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grignote',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: false,
      connectTimeout: 20000
    });
  }
  
  // En production (Railway)
  console.log('Mode: production (Railway)');
  
  // Priorité 1: Utiliser MYSQL_URL si disponible
  if (process.env.MYSQL_URL) {
    console.log('Utilisation de MYSQL_URL pour la connexion');
    return mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000
    });
  }
  
  // Priorité 2: Utiliser les variables MYSQL_* si disponibles
  if (process.env.MYSQLHOST) {
    console.log('Utilisation des variables MYSQL_* pour la connexion');
    return mysql.createPool({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000
    });
  }
  
  // Priorité 3: Fallback sur les variables DB_*
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
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000
  });
}

const pool = createConnectionPool();

// Tester la connexion au démarrage avec plusieurs tentatives
let attempts = 0;
const maxAttempts = 5;

function tryConnection() {
  attempts++;
  console.log(`Tentative de connexion ${attempts}/${maxAttempts}...`);
  
  return pool.getConnection()
    .then(connection => {
      console.log('✅ Connexion à la base de données établie avec succès');
      connection.release();
    })
    .catch(err => {
      console.error(`❌ Erreur de connexion à la base de données (tentative ${attempts}/${maxAttempts}):`, err);
      
      if (attempts < maxAttempts) {
        console.log(`Nouvelle tentative dans 5 secondes...`);
        return new Promise(resolve => setTimeout(() => resolve(tryConnection()), 5000));
      } else {
        console.error('Nombre maximum de tentatives atteint. Échec de la connexion à la base de données.');
      }
    });
}

tryConnection();

module.exports = pool;