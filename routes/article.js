const express = require('express');
const router = express.Router();
// const app = express();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const pool = require('../services/connection');
const { storage, cloudinary } = require('../config/cloudinary');
// Initialisation de multer avec ce stockage
const upload = multer({ storage });

// Middleware d'authentification
function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Non authentifié' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); // Token valide, on continue
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}

router.get('/user/:idUser', async (req, res) => {
    const idUser = req.params.idUser;
    try {
        const [rows] = await pool.query('SELECT * FROM article WHERE idUser = ?', [idUser]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Récupérer un article par son ID

router.get('/:id', async (req, res) => {

    try {

        // Requête SQL avec un paramètre (sécurisé avec ?)
        const [rows] = await pool.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);

        if (rows.length === 0) {
            // Si aucun article trouvé avec cet ID, on retourne une erreur 404
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        const article = rows[0];

        // Récupérer les tags associés à cet article
        const [tags] = await pool.query(
            //t = alias pour tag, ta = tag_article
            'SELECT t.idTag, t.name FROM tag t JOIN tag_article ta ON t.idTag = ta.idTag WHERE ta.idArticle = ?',
            [req.params.id]
        );

        // Ajouter les tags à l'objet article
        article.tags = tags;

        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Récupérer tous les articles avec leurs tags
router.get('/', async (req, res) => {
    try {
        // 1. Récupérer tous les articles (les plus récents en premier)
        const [articles] = await pool.query('SELECT * FROM article ORDER BY date DESC, idArticle DESC');

        // 2. Récupérer tous les tags avec leurs associations en une requête
        const [tagAssociations] = await pool.query(`
            SELECT 
                ta.idArticle,
                t.idTag,
                t.name
            FROM tag_article ta
            JOIN tag t ON ta.idTag = t.idTag
            ORDER BY ta.idArticle, t.name
        `);

        // 3. Organiser les tags par article
        const tagsByArticle = {};
        tagAssociations.forEach(association => {
            if (!tagsByArticle[association.idArticle]) {
                tagsByArticle[association.idArticle] = [];
            }
            tagsByArticle[association.idArticle].push({
                idTag: association.idTag,
                name: association.name
            });
        });

        // 4. Ajouter les tags à chaque article
        const articlesWithTags = articles.map(article => ({
            ...article,
            tags: tagsByArticle[article.idArticle] || []
        }));

        console.log('Articles avec tags:', articlesWithTags.map(a => ({
            id: a.idArticle,
            title: a.title,
            tags: a.tags.map(t => t.name)
        })));

        res.json(articlesWithTags);
    } catch (err) {
        console.error('Erreur récupération articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Créer un nouvel article

router.post('/', upload.single('image'), async (req, res) => {

    const { title, ingredient, content, category, idUser } = req.body;


    // L'image téléversée est dans req.file.path (URL Cloudinary)
    const image = req.file ? req.file.path : null;
    // Validation : on vérifie que les champs sont rempli
    if (!title || !ingredient || !content || !category || !idUser) return res.status(400).json({ message: 'Champs requis' });

    try {

        // Requête pour insérer un nouvel article dans la base
        const [result] = await pool.query('INSERT INTO article (title, ingredient, content, category, image, idUser) VALUES (?, ?, ?, ?, ?, ?)', [title, ingredient, content, category, image || null, idUser]);

        // On retourne l'article nouvellement crée avec don ID généré automatiquement
        const newArticle = { id: result.insertId, title, ingredient, content, category, image, idUser };
        // Si des tags sont envoyés
        if (req.body.tags) {
            const tagIds = JSON.parse(req.body.tags); // tableau d'IDs de tags
            if (tagIds.length > 0) {
                const values = tagIds.map(tagId => [tagId, result.insertId]);
                await pool.query(
                    'INSERT INTO tag_article (idTag, idArticle) VALUES ?',
                    [values]
                );
            }
        }

        res.status(201).json(newArticle); // 201 = Created
    } catch (err) {
        console.error('Erreur SQL:', err);
        // res.status(500).json({ error: 'Erreur serveur' });
        res.status(500).json({ error: err.message });
    }
});

// Modifier un article existant

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, ingredient, content, category } = req.body;
    const image = req.file ? req.file.path : null;

    // Validation
    if (!title || !ingredient || !content || !category) return res.status(400).json({ message: 'Champs requis' });

    try {


        // Récupérer l'article existant
        const [rows] = await pool.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);
        const article = rows[0];

        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        // Vérifier si auteur ou admin
        if (req.user.role !== 'admin' && article.idUser !== req.user.idUser) {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        // Mise à jour
        await pool.query(
            'UPDATE article SET title = ?, ingredient = ?, content = ?, category = ?, image = ? WHERE idArticle = ?',
            [title, ingredient, content, category, image || article.image, req.params.id]
        );

        // Supprimer les anciens tags de l'article
        await pool.query('DELETE FROM tag_article WHERE idArticle = ?', [req.params.id]);

        // Réinsérer les nouveaux si envoyés
        if (req.body.tags) {
            const tagIds = JSON.parse(req.body.tags);
            if (tagIds.length > 0) {
                const values = tagIds.map(tagId => [tagId, req.params.id]);
                await pool.query(
                    'INSERT INTO tag_article (idTag, idArticle) VALUES ?',
                    [values]
                );
            }
        }

        // On retourne l'article modifié (nouvelle valeur)
        res.json({ id: parseInt(req.params.id), title, ingredient, content, category, image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un article par ID

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;

        // Vérifier si l'article existe
        const [rows] = await pool.query('SELECT * FROM article WHERE idArticle = ?', [id]);
        const article = rows[0];

        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        // Vérifier l'auteur de l'article
        const [userRows] = await pool.query('SELECT * FROM user WHERE idUser = ?', [article.idUser]);
        const userArticle = userRows[0];

        if (!userArticle) {
            return res.status(404).json({ message: 'Auteur de l\'article non trouvé' });
        }

        // Vérifier si auteur ou admin
        if (req.user.role !== 'admin' && article.idUser !== req.user.idUser) {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        // Supprimer l'image de Cloudinary
          if (article.image) {
            const publicId = article.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`grignotages/${publicId}`);
        }

        // Supprimer les associations tags
        await pool.query('DELETE FROM tag_article WHERE idArticle = ?', [id]);
        // Supprimer les commentaires associés
        await pool.query('DELETE FROM comment WHERE idArticle = ?', [id]);
        // Supprimer les favoris associés
        await pool.query('DELETE FROM favori WHERE idArticle = ?', [id]);
        // Supprimer
        await pool.query('DELETE FROM article WHERE idArticle = ?', [id]);
        res.status(204).send();

    } catch (err) {
        console.error('Erreur delete :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router