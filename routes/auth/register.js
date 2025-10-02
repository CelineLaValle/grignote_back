const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Pour hacher les mots de passe
const sendVerificationMail = require('../../services/mailer'); // import du fichier mailer.js
const { v4: uuidv4 } = require('uuid'); // pour générer le token



const pool = require('../../services/connection');

router.post('/', async (req, res) => {
    const { pseudo, email, password } = req.body;

    // Vérifie que les champs sont fournis
    if (!pseudo || !email || !password) {
        return res.status(400).json({ message: 'Les champs sont requis' });
    }

    try {

        // Vérifie si l'utilisateur existe déjà
        const [existingUsers] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Utilisateur déjà existant' });
        }

        // Hache le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Valeur par défaut du role lorsqu'un utilisateur s'inscrit
        const role = 'utilisateur';

        // Enregistre l'utilisateur dans la base de données
        const [result] = await pool.query('INSERT INTO user (pseudo, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)', [pseudo, email, hashedPassword, role, 1]);

        // Génère un token pour l'email
        const verifyToken = uuidv4();

        // Stocke le token dans la table user (ajoute d'abord la colonne verify_token si nécessaire)
        await pool.query(
            'UPDATE user SET verify_token = ? WHERE idUser = ?',
            [verifyToken, result.insertId]
        );

        // Envoie le mail de confirmation
        await sendVerificationMail(email, verifyToken);

        res.status(201).json({ message: 'Utilisateur inscrit', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;