const express = require('express');
const router = express.Router();


router.post('/', (req, res) => {
    // On efface le cookie nommé 'token' en le vidant
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });

    // On retourne une réponse de succès
    res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;