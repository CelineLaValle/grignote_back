const express = require('express');
const router = express.Router();
// const app = express();
const connection = require('../services/connection.js');


// Récupérer un article par son ID

router.get('/:id', async (req, res) => {
    
    try {
        const getConnection = await connection();
        // Requête SQL avec un paramètre (sécurisé avec ?)
        const [rows] = await getConnection.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);

        if (rows.length === 0) {
            // Si aucun article trouvé avec cet ID, on retourne une erreur 404
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        res.json(rows[0]); // On retourne l'article trouvé
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer tous les articles

router.get('/', async (req, res) => {
    try {
        const getConnection = await connection();
        const [rows] = await getConnection.query('SELECT * FROM article');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouvel article

router.post('/', async (req, res) => {
    const { title, ingredient, content, category, image, idUser } = req.body;

    // Validation : on vérifie que les champs sont rempli
    if (!title || !ingredient || !content || !category || !idUser) return res.status(400).json({ message: 'Champs requis' });

    try {
        const getConnection = await connection();
        // Requête pour insérer un nouvel article dans la base
        const [result] = await getConnection.query('INSERT INTO article (title, ingredient, content, category, image, idUser) VALUES (?, ?, ?, ?, ?, ?)', [title, ingredient, content, category, image || null, idUser]);

        // On retourne l'article nouvellement crée avec don ID généré automatiquement
        const newArticle = { id: result.insertId, title, ingredient, content, category, image, idUser };
        res.status(201).json(newArticle); // 201 = Created
    } catch (err) {
        // res.status(500).json({ error: 'Erreur serveur' });
            res.status(500).json({ error: err.message });
    }
});

// Modifier un article existant

router.put('/:id', async (req, res) => {
    const { title, ingredient, content, category, image } = req.body;

    // Validation
    if (!title || !ingredient || !content || !category) return res.status(400).json({ message: 'Champs requis' });

    try {
        const getConnection = await connection();
        // On met à jour l'article dont l'id est fourni
        const [result] = await getConnection.query( 'UPDATE article SET title = ?, ingredient = ?, content = ?, category = ?, image = ? WHERE idArticle = ?',
            [title, ingredient, content, category, image || null, req.params.id]
        );


        if (result.affectedRows === 0) {
            // Aucun article mis à jour : l'ID n'existe pas
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        // On retourne l'article modifié (nouvelle valeur)
        res.json({ id: parseInt(req.params.id), title, ingredient, content, category, image });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router