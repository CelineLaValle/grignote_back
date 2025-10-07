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

// Création d’une instance d’Express
const app = express();

// Configuration des options CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'https://grignote-front-34i6.vercel.app'],
  credentials: true, // Autorise l'envoi de cookies
};

app.use(cors(corsOptions));


// Middleware pour parser les données JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());

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


// Lancement du serveur
app.listen(4000, () => {
  console.log('Serveur démarré sur le port 4000');
});