const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Pour hacher les mots de passe
const connection = require('../../services/connection.js');


router.post('/', async (req, res) => {
    const {pseudo, email, password, avatar} = req.body;

    // Vérifie que les champs sont fournis
    if (!pseudo || !email || !password) {
        return res.status(400).json({message: 'Les champs sont requis'});
    }

    try {
        const getConnection = await connection();

        // Vérifie si l'utilisateur existe déjà
        const [existingUsers] = await getConnection.query('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({message: 'Utilisateur déjà existant'});
        }

        // Hache le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Valeur par défaut du role lorsqu'un utilisateur s'inscrit
        const role = 'utilisateur';

        // Enregistre l'utilisateur dans la base de données
        const [result] = await getConnection.query('INSERT INTO user (pseudo, email, password, avatar, role) VALUES (?, ?, ?, ?, ?)', [pseudo, email, hashedPassword, avatar || null, role]);

        res.status(201).json({message: 'Utilisateur inscrit', userId: result.insertId});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Erreur serveur'});
    }
});

module.exports = router;