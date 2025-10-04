const express = require('express');
const router = express.Router();
const pool = require('../services/connection');



// Récupérer toutes les catégories distinctes
router.get('/', async (req, res) => {
  try {
    // Ici LIKE affiche directement la colonne category
    const [rows] = await pool.query("SHOW COLUMNS FROM article LIKE 'category'");

    if (rows.length === 0) return res.json([]);

    // Le type est quelque chose comme 'enum('Entrée','Plat','Dessert')'
    const enumString = rows[0].Type;
    const categories = enumString
      .replace('enum(', '')
      .replace(')', '')
      .split(',')
      .map(v => v.replace(/'/g, '')); // on enlève les quotes

    res.json(categories);
  } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router;