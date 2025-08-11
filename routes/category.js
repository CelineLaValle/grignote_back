const express = require('express');
const router = express.Router();
const connection = require('../services/connection.js');


// Récupérer toutes les catégories distinctes
router.get('/', async (req, res) => {
    try {
        const getConnection = await connection();
        const [rows] = await getConnection.query('SELECT DISTINCT category FROM article');
        // On renvoie seulement un tableau de noms
        const categories = rows.map(row => row.category);
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;