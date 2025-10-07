const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Pour comparer les mots de passe hachés
const jwt = require('jsonwebtoken'); // Pour créer un token
const pool = require('../../services/connection');

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    // Vérifie que les champs sont fournis
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    try {

        // Cherche l'utilisateur par email
        const [users] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérifier si l'utilisateur est suspendu
        if (Number(user.suspended) === 1) {
            return res.status(403).json({ message: 'Votre compte est suspendu. Contactez un administrateur.' });
        }

        // Vérifie que l’utilisateur a confirmé son email
        if (user.is_verified === 0) {
            return res.status(403).json({ message: 'Veuillez vérifier votre email avant de vous connecter.' });
        }


        // Compare le mot de passe donné avec celui de la base
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
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

        // Envoie le token dans un cookie HTTP-only
        res.setHeader('Set-Cookie', [
            `token=${token}; Path=/; Max-Age=7200; HttpOnly; Secure; SameSite=None; Partitioned; Expires=${new Date(Date.now() + 7200 * 1000).toUTCString()}`
        ]);

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
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;