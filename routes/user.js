const express = require('express');
const router = express.Router();
const pool = require('../services/connection');
const authMiddleware = require('../middleware/auth');


// Récupérer tout les utilisateurs

router.get('/', async (req, res) => {

    try {

        const [user] = await pool.query('SELECT * FROM user');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer un utilisateur par son ID

router.get('/:id', async (req, res) => {
    try {

        const [rows] = await pool.query('SELECT * FROM user WHERE idUser = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(rows[0]); // Renvoie l'utilisateur trouvé
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un utilisateur

router.put('/:id', authMiddleware, async (req, res) => {
    const { pseudo, email, role } = req.body;

    try {


        const [result] = await pool.query('UPDATE user SET pseudo = ?, email = ?, role = ? WHERE idUser = ?', [pseudo, email, role, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ message: 'Utilisateur mis à jour' });

    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Suspendre/Réactiver un utilisateur (toggle)
router.patch('/suspend/:id', authMiddleware, async (req, res) => {
    try {


        // Récupérer l'état actuel
        const [rows] = await pool.query(
            'SELECT suspended FROM user WHERE idUser = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const currentStatus = Number(rows[0].suspended); // Convertir en nombre
        const newStatus = currentStatus === 1 ? 0 : 1;

        await pool.query(
            'UPDATE user SET suspended = ? WHERE idUser = ?',
            [newStatus, req.params.id]
        );

        res.json({
            message: `Utilisateur ${newStatus ? 'suspendu' : 'réactivé'} avec succès`,
            suspended: newStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Supprimer un utilisateur

router.delete('/:id', authMiddleware, async (req, res) => {

    try {

        const [result] = await pool.query('DELETE FROM user WHERE idUser = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;