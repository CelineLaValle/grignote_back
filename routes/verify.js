const express = require('express');
const router = express.Router();
const pool = require('../services/connection');


router.get('/', async (req, res) => {
    const token = req.query.token; // Récupère ?token=xxxx dans l'URL
    if (!token) {
        return res.status(400).json({ message: 'Token manquant' });
    }

    try {


        // Cherche l'utilisateur avec ce token
        const [users] = await pool.query(
            'SELECT * FROM user WHERE verify_token = ?',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Lien invalide ou expiré' });
        }

        const userId = users[0].idUser;

        // Active le compte et supprime le token
        await pool.query(
            'UPDATE user SET is_verified = 1, verify_token = NULL WHERE idUser = ?',
            [userId]
        );

        res.json({ message: 'Email vérifié avec succès' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
