const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Pour comparer les mots de passe hachés
const jwt = require('jsonwebtoken'); // Pour créer un token
const connection = require('../../services/connection');

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);

    // Vérifie que les champs sont fournis
    if (!email || !password) {
        return res.status(400).json({ message: 'Identifiants requis' });
    }

    try {
        const getConnection = await connection();

        // Cherche l'utilisateur par email
        const [users] = await getConnection.query('SELECT * FROM user WHERE email = ?', [email]);
        console.log('Users found:', users);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Compare le mot de passe donné avec celui de la base
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('Password match:', passwordMatch);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérifie que la clé est bien présente
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET manquant dans .env');
        }

        // Crée un Token JWT
        const token = jwt.sign(
            {
                idUser: user.idUser,
                pseudo: user.pseudo,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        console.log('Token generated:', token); 
        // Envoie le token dans un cookie HTTP-only
        res.cookie('token', token, {
            httpOnly: true, // Protège contre les attaques XSS : JavaScript ne peut pas lire le cookie
            secure: process.env.NODE_ENV === 'production', // Envoie le cookie uniquement en HTTPS si on est en production
            sameSite: 'strict', // Empêche l'envoi du cookie sur des requêtes cross-site -> protection CSRF
            maxAge: 2 * 60 * 60 * 1000 // Durée de vie du cookie en millisecondes (2h ici)
        });

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                idUser: user.idUser,
                pseudo: user.pseudo,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;