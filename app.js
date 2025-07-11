// Importation des librairies (packages)
const express = require('express');
// const cors = require('cors')
const article = require('./routes/article.js');
const tag = require('./routes/tag.js');
const user = require('./routes/user.js');
const register = require('./routes/auth/register.js');
const login = require('./routes/auth/login.js');
const logout = require('./routes/auth/logout.js');
const connection = require('./services/connection.js');
// const cookieParser = require('cookie-parser')
// const mysql = require('mysql2');
require('dotenv').config();




// connection.query(
//     'SELECT * FROM tag', 
//     function (err, results, fields) {
//         console.log(results);

//     }
// )


const app = express();
// Middleware pour parser le JSON dans le body
app.use(express.json());


const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Importer les routes
app.use('/article', article)

app.use('/tag', tag)

app.use('/user', user)

app.use('/auth', register, login, logout)

connection();
// Démarrer le serveur sur le port 4000
app.listen(4000, () => {
    console.log('Serveur démarré sur le port 4000');
})


