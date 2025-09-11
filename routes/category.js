const express = require('express');
const router = express.Router();
const pool = require('../services/connection');



// Récupérer toutes les catégories distinctes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM article LIKE 'category'");

    if (rows.length === 0) return res.json([]);

    // Le type est quelque chose comme "enum('Entrée','Plat','Dessert')"
    const enumString = rows[0].Type;
    const categories = enumString
      .replace("enum(", "")
      .replace(")", "")
      .split(",")
      .map(v => v.replace(/'/g, "")); // on enlève les quotes

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;


// router.get('/', async (req, res) => {
//     try {
//         const pool = app.locals.db;
//         const [rows] = await pool.query("SHOW COLUMNS FROM article LIKE 'category'");
//         // On renvoie seulement un tableau de noms
//         const categories = rows.map(row => row.category);
//         res.json(categories);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Erreur serveur' });
//     }
// });