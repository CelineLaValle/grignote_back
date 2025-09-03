const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const token = req.cookies.token; // récupère le token dans le cookie
    if (!token) {
        return res.status(401).json({ message: 'Non authentifié' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ici decoded contient idUser, pseudo, email, role
        next(); // passe à la route suivante
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}

module.exports = authMiddleware;

