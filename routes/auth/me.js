const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {

    // Récupération du token JWT depuis les cookies envoyés par le navigateur
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Non authentifié' });
    }
    try {
        // Vérification du token avec la clé secrète
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // On renvoie les infos de l'utilisateur sous forme JSON
        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ message: 'Token invalide' });
    }
});

module.exports = router;