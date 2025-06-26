// Importation des librairies (packages)
const express = require('express');
// const cors = require('cors')
const index = require('./routes/index.js');
const connection = require('./services/connection.js');
// const cookieParser = require('cookie-parser')
const mysql = require('mysql2');
require('dotenv').config();




// connection.query(
//     'SELECT * FROM tag', 
//     function (err, results, fields) {
//         console.log(results);

//     }
// )


const app = express();
connection();
// Démarrer le serveur sur le port 4000
app.listen(4000, () => {
    console.log('Serveur démarré sur le port 4000');
})

// Importer la route user
app.use('', index)



