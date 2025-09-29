const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

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
const connection = require('./services/connection.js');
const app = express();

// 🚀 Route de test santé
app.get('/ping', (req, res) => {
  res.json({ message: 'pong 🏓' });
});


// Middleware de débogage - AJOUTER AU DÉBUT
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Intercepter la réponse pour la logger
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Réponse: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
    return originalSend.call(this, body);
  };
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://grignote-front-34i6.vercel.app/',  
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // important si tu utilises des cookies / sessions
}));


// // Ajout des headers CORS manuellement pour résoudre les problèmes persistants
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
//   // Répondre immédiatement aux requêtes OPTIONS
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }
  
//   next();
// });


// Middleware pour parser les données JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());

// // Vérification de la connexion à la base de données avec gestion d'erreur améliorée
// app.use(async (req, res, next) => {
//   try {
//     // Tester la connexion à la base de données
//     const [rows] = await connection.query('SELECT 1');
//     next();
//   } catch (error) {
//     console.error('Erreur de connexion à la base de données:', error);
//     res.status(500).json({ error: 'Erreur de connexion à la base de données' });
//   }
// });

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static('uploads'));

// Routes d'authentification (à séparer pour éviter les conflits)
app.use('/auth/register', register);
app.use('/auth/login', login);
app.use('/auth/logout', logout);
app.use('/auth/me', authMe); // Ajout de la route pour récupérer les infos utilisateur

// Routes principales
app.use('/article', article);
app.use('/tag', tag);
app.use('/comment', comment);
app.use('/user', user);
app.use('/category', category);
app.use('/favori', favori);
app.use('/verify', verify);

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
  console.log('Mode:', process.env.NODE_ENV || 'développement');
  console.log('Variables d\'environnement:');
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
});