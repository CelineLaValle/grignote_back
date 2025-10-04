const express = require('express');
const router = express.Router();
// const app = express();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const pool = require('../services/connection');
const { storage, cloudinary } = require('../config/cloudinary');
const upload = multer({ storage });  // Indique à Multer comment et où stocker les images (ici sur Cloudinary)

// // Middleware d'authentification
// function authMiddleware(req, res, next) {
//     const token = req.cookies.token;
//     if (!token) return res.status(401).json({ message: 'Non authentifié' });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next(); // Token valide, on continue
//     } catch (err) {
//         return res.status(401).json({ message: 'Token invalide' });
//     }
// }

router.get('/user/:idUser', async (req, res) => {
    const idUser = req.user.idUser;
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
        const [tags] = await pool.query(`
            SELECT tag.idTag, tag.name 
            FROM tag 
            JOIN tag_article
            ON tag.idTag = tag_article.idTag 
            WHERE tag_article.idArticle = ?
        `,
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
        //Récupérer tous les articles (les plus récents en premier)
        const [articles] = await pool.query('SELECT * FROM article ORDER BY date DESC, idArticle DESC');

        //Récupérer tous les tags avec leurs associations en une requête
        const [tagAssociations] = await pool.query(`
            SELECT tag_article.idArticle, tag.idTag, tag.name 
            FROM tag_article 
            JOIN tag ON tag_article.idTag = tag.idTag 
            ORDER BY tag_article.idArticle, tag.name`);

        // Remplit un objet (tagsByArticle) avec les tags associés à chaque article
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

        // Transforme chaque article pour lui ajouter ses tags
        const articlesWithTags = articles.map(article => ({
            ...article,
            tags: tagsByArticle[article.idArticle] || []
        }));

        res.json(articlesWithTags);
    } catch (err) {
        console.error('Erreur récupération articles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Créer un nouvel article

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {

    // On récupère les données du formulaire depuis req.body
    const { title, ingredient, content, category, idUser } = req.body;

    // L'image téléversée est dans req.file.path (URL Cloudinary)
    const image = req.file ? req.file.path : null;
    // Validation : on vérifie que les champs sont rempli
    if (!title || !ingredient || !content || !category || !idUser) return res.status(400).json({ message: 'Champs requis' });

    try {

        // Requête pour insérer un nouvel article dans la base
        const [result] = await pool.query('INSERT INTO article (title, ingredient, content, category, image, idUser) VALUES (?, ?, ?, ?, ?, ?)', [title, ingredient, content, category, image || null, idUser]);

        // On retourne l'article nouvellement crée avec son ID généré automatiquement
        const newArticle = { id: result.insertId, title, ingredient, content, category, image, idUser };
        // Si des tags sont envoyés avec l'article, les associer à l'article créé
        if (req.body.tags) {
            const tagIds = JSON.parse(req.body.tags); // Récupérer le tableau d'IDs en JSON
            if (tagIds.length > 0) {
                // Crée un tableau [idTag, idArticle] pour l'insertion
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

// Modifier un article

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

            // Met à jour les tags seulement si de nouveaux tags sont envoyés
            if (req.body.tags) {
                const tagIds = JSON.parse(req.body.tags);
                if (tagIds.length > 0) {
                    // Supprimer les anciens tags uniquement si on a de nouveaux tags
                    await pool.query('DELETE FROM tag_article WHERE idArticle = ?', [req.params.id]);

                    // Insérer les nouveaux tags
                    const values = tagIds.map(tagId => [tagId, req.params.id]);
                    await pool.query('INSERT INTO tag_article (idTag, idArticle) VALUES ?', [values]);
                }
            }
        

        // On retourne l'article modifié (nouvelle valeur)
        res.json({ id: parseInt(req.params.id), title, ingredient, content, category, image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un article

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Récupère l'identifiant de l'article depuis l'URL
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


        // Supprimer toutes les associations liées à cet article
        await pool.query('DELETE FROM tag_article WHERE idArticle = ?', [id]);

        await pool.query('DELETE FROM comment WHERE idArticle = ?', [id]);

        await pool.query('DELETE FROM favori WHERE idArticle = ?', [id]);

        // Supprimer l'article
        await pool.query('DELETE FROM article WHERE idArticle = ?', [id]);
        res.status(204).send();

    } catch (err) {
        console.error('Erreur delete :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router