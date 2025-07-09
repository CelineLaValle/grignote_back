const express = require('express');
const router = express.Router();

router.post('/logout', (req, res) => {
    // On efface le cookie nommé "token" en le vidant
    res.clearCookie('token', {
        httpOnly: true, // Doit être cohérent avec celui défini au login
        secure: true, // Toujours 'true' si vous êtes en HTTPS
        sameSite: 'strict' // Même chose, doit être cohérent avec le cookie original
    });

    // On retourne une réponse de succès
    res.json({message: 'Déconnexion réussie'});
});

module.exports = router;