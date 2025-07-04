const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Pour comparer les mots de passe hachés
const jwt = require('jsonwebtoken'); // Pour créer un token
const connection = require('../../services/connection');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Vérifie que les champs sont fournis
    if (!email || !password) {
        return res.status(400).json({ message: 'Identifiants requis' });
    }

    try {
        const getConnection = await connection();

        // Cherche l'utilisateur par email
        const [users] = await getConnection.query('SELECT * FROM user WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

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
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ message: 'Connexion réussie', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router;