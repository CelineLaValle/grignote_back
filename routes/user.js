const express = require('express');
const router = express.Router();
const connection = require('../services/connection');


// Récupérer tout les utilisateurs

router.get('/', async (req, res) => {

    try {
        const getConnection = await connection();
        const [user] = await getConnection.query('SELECT * FROM user');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un utilisateur

router.put('/:id', async (req, res) => {
    const { pseudo, email, role } = req.body;

    try {

        const getConnection = await connection();
        const [result] = await getConnection.query('UPDATE user SET pseudo = ?, email = ?, role = ? WHERE idUser = ?', [pseudo, email, role, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ message: 'Utilisateur mis à jour' });

    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Suspendre/Réactiver un utilisateur

router.patch('/suspend/:id', async (req, res) => {
    const { suspended } = req.body; // true ou false

    try {
        const getConnection = await connection();
        const [result] = await getConnection.query('UPDATE user SET suspended = ? WHERE idUser = ?', [suspended, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ message: 'Statut mis à jour' });

    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un utilisateur

router.delete('/:id', async (req, res) => {

    try {
        const getConnection = await connection();
        const [result] = await getConnection.query('DELETE FROM user WHERE idUser = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;