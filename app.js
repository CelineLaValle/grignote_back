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
const authMe = require('./routes/auth/me.js'); // Import de la route pour récupérer les infos utilisateur
const connection = require('./services/connection.js');

const app = express();

// Configurez CORS pour autoriser les requêtes avec des informations d'identification
const corsOptions = {
  origin: ['http://localhost:3000', 'https://grignote-front-34i6.vercel.app'], // Remplacez par l'origine de votre application frontend
  credentials: true, // Autorisez les requêtes avec des informations d'identification
};

app.use(cors(corsOptions));


// Middleware pour parser les données JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', 'https://grignote-front-34i6.vercel.app');
    res.set('Access-Control-Allow-Credentials', 'true');
  }
}));

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


app.use((req, res, next) => {
    next();
});

// Lancement du serveur
app.listen(4000, () => {
    console.log('Serveur démarré sur le port 4000');
});