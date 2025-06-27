const express = require('express');
const router = express.Router();
const app = express();




app.get('/hello', (req, res) => {
    console.log('hello'),
        res.send('Bienvenue sur la page d\'accueil')
});

module.exports = router