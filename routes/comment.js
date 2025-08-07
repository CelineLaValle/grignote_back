console.log("Router /comment chargé !");

const express = require('express');
const router = express.Router();
const connection = require('../services/connection');


// Ajouter un commentaire

router.post('/', async (req, res) => {
    console.log("Route POST /comment appelée");
    // On récupère les champs depuis le body de la requête
    const { idUser, idArticle, content } = req.body;

    // Vérification des champs obligatoires
    if (!idUser || !idArticle || !content) {
        return res.status(400).json({ message: 'Champs requis manquants.' });
    }

    try {
        const getConnection = await connection();

        // Insertion du commentaire dans la base de données
        const [result] = await getConnection.query(
            'INSERT INTO comment (idUser, idArticle, content, date) VALUES (?, ?, ?, NOW())', [idUser, idArticle, content]
        );

        // Réponse au client avec l'ID du commentaire crée
        res.status(201).json({ message: 'Commentaire ajouté', idComment: result.insertId });
    } catch (err) {
        console.error('Erreur lors de l\'ajout du commentaire :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer tous les commentaires d'un article

router.get('/:idArticle', async (req, res) => {
    const { idArticle } = req.params; // On récupère l'ID de l'article depuis l'URL

    try {
        const getConnection = await connection();

        // On récupère tous les commentaires liés à cet article (et on peut aussi récupérer le pseudo de l'utilisateur)
        const [comments] = await getConnection.query(
            `SELECT c.idComment, c.content, c.date, u.pseudo
            FROM comment c
            JOIN user u ON u.idUser = c.idUser
            WHERE c.idArticle = ?
            ORDER BY c.date DESC`,
            [idArticle]);

        // On retourne la liste des commentaires au client
        res.json(comments);
    } catch (err) {
        console.error('Erreur lors de la récupération des commentaires :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;