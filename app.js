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

// Configurez CORS pour autoriser les requêtes avec des informations d'identification
const corsOptions = {
  origin: function(origin, callback) {
    // Autoriser toutes les origines en développement local
    // En production, utiliser les origines spécifiques
    if (!origin || origin === 'http://localhost:3000' || origin === process.env.FRONTEND_URL || origin.includes('vercel.app')) {
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
  res.status(500).json({ error: 'Erreur serveur' });
});

// Route par défaut pour éviter les erreurs HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Lancement du serveur
app.listen(4000, () => {
    console.log('Serveur démarré sur le port 4000');
});
