const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const connection = require('./services/connection.js');

const app = express();

// Middleware de débogage
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configurez CORS pour autoriser les requêtes avec des informations d'identification
const corsOptions = {
  origin: function(origin, callback) {
    // Autoriser toutes les origines en développement local
    // En production, utiliser les origines spécifiques
    if (!origin || origin === 'http://localhost:3000' || origin === process.env.FRONTEND_URL || origin.includes('vercel.app')) {
      console.log('CORS autorisé pour:', origin);
      callback(null, true);
    } else {
      console.log('CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware pour parser les données JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());

// Vérification de la connexion à la base de données avant de charger les routes
let dbConnected = false;

// Tester la connexion à la base de données
(async function testDbConnection() {
  try {
    const [rows] = await connection.query('SELECT 1');
    dbConnected = true;
    console.log('✅ Test de connexion à la base de données réussi');
    
    // Charger les routes seulement après avoir vérifié la connexion
    loadRoutes();
  } catch (error) {
    console.error('❌ Test de connexion à la base de données échoué:', error);
    
    // Réessayer après 5 secondes
    setTimeout(testDbConnection, 5000);
  }
})();

// Middleware pour vérifier l'état de la connexion à la base de données
app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ 
      error: 'Service temporairement indisponible', 
      message: 'La connexion à la base de données est en cours d\'établissement. Veuillez réessayer dans quelques instants.' 
    });
  }
  next();
});

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static('uploads'));

// Fonction pour charger les routes
function loadRoutes() {
  const article = require('./routes/article.js');
  const tag = require('./routes/tag.js');
  const comment = require('./routes/comment.js');
  const user = require('./routes/user.js');
  const category = require('./routes/category.js');
  const favori = require('./routes/favori.js');
  const verify = require('./routes/verify');
  const register = require('./routes/auth/register.js');
  const login = require('./routes/auth/login.js');
  const logout = require('./routes/auth/logout.js');
  const authMe = require('./routes/auth/me.js');

  // Routes d'authentification
  app.use('/auth/register', register);
  app.use('/auth/login', login);
  app.use('/auth/logout', logout);
  app.use('/auth/me', authMe);

  // Routes principales
  app.use('/article', article);
  app.use('/tag', tag);
  app.use('/comment', comment);
  app.use('/user', user);
  app.use('/category', category);
  app.use('/favori', favori);
  app.use('/verify', verify);

  console.log('✅ Routes chargées avec succès');
}

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur serveur', message: err.message });
});

// Route par défaut pour éviter les erreurs HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Lancement du serveur
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log('Variables d\'environnement:');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('- DB_HOST:', process.env.DB_HOST || 'non défini');
    console.log('- RAILWAY_PRIVATE_DOMAIN:', process.env.RAILWAY_PRIVATE_DOMAIN || 'non défini');
    console.log('- DB_PORT:', process.env.DB_PORT || '3306 (défaut)');
});
