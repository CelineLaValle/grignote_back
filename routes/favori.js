const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../services/connection');


// Ajouter un favori
router.post("/", auth, async (req, res) => {
  try {
    const { idArticle } = req.body; // On récupèr el'id de l'article à ajouter
    const idUser = req.user.idUser; // récupéré depuis le middleware

    if (!idUser) return res.status(401).json({ error: "Non connecté" });



// Utilisation de INSERT IGNORE pour éviter les doublons
    await pool.query(
      "INSERT IGNORE INTO favori (idUser, idArticle) VALUES (?, ?)",
      [idUser, idArticle]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur ajout favori :", err);
    res.status(500).json({ error: "Erreur ajout favori" });
  }
});

// Supprimer un favori
router.delete("/:idArticle", auth, async (req, res) => {
  try {
    const idUser = req.user.idUser;

    if (!idUser) return res.status(401).json({ error: "Non connecté" });


    // On supprime le favori dans la base
    await pool.query(
      "DELETE FROM favori WHERE idUser = ? AND idArticle = ?",
      [idUser, req.params.idArticle]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression favori :", err);
    res.status(500).json({ error: "Erreur suppression favori" });
  }
});

// Récupérer les favoris d'un utilisateur
router.get("/", auth, async (req, res) => {
  try {
    const idUser = req.user.idUser;

    if (!idUser) return res.status(401).json({ error: "Non connecté" });


    // On récupère les infos des articles favoris en les joignant avec la table article
    const [rows] = await pool.query(
      `SELECT a.* 
       FROM favori f
       JOIN article a ON f.idArticle = a.idArticle
       WHERE f.idUser = ?`,
      [idUser]
    );

    res.json(rows);  // On envoie la liste des favoris
  } catch (err) {
    console.error("Erreur récupération favoris :", err);
    res.status(500).json({ error: "Erreur récupération favoris" });
  }
});

module.exports = router;
