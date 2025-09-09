const express = require('express');
const router = express.Router();
// const app = express();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Middleware d'authentification
function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Non authentifié' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // injecte l’utilisateur dans la requête
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}


// Définition de l'endroit où seront stockées les images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ici, tous les fichiers seront enregistrés dans le dossier 'uploads'
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // On renomme le fichier pour éviter les conflits : DateActuelle-NomOriginal
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// Initialisation de multer avec ce stockage
const upload = multer({ storage });


router.get('/user/:idUser', async (req, res) => {
    const idUser = req.params.idUser;
    try {
        const getConnection = app.locals.db;
        const [rows] = await getConnection.query('SELECT * FROM article WHERE idUser = ?', [idUser]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Récupérer un article par son ID

router.get('/:id', async (req, res) => {

    try {
        const getConnection = app.locals.db;
        // Requête SQL avec un paramètre (sécurisé avec ?)
        const [rows] = await getConnection.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);

        if (rows.length === 0) {
            // Si aucun article trouvé avec cet ID, on retourne une erreur 404
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        const article = rows[0];

        // Récupérer les tags associés à cet article
        const [tags] = await getConnection.query(
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

// Récupérer tous les articles

router.get('/', async (req, res) => {
    try {
        const getConnection = app.locals.db;
        const [rows] = await getConnection.query('SELECT * FROM article');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Créer un nouvel article

router.post('/', upload.single('image'), async (req, res) => {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const { title, ingredient, content, category, idUser } = req.body;
    console.log('BODY:', req.body);


    // L'image téléversée est dans req.file (si elle existe)
    const image = req.file ? req.file.filename : null;
    // Validation : on vérifie que les champs sont rempli
    if (!title || !ingredient || !content || !category || !idUser) return res.status(400).json({ message: 'Champs requis' });

    try {
        const getConnection = app.locals.db;
        // Requête pour insérer un nouvel article dans la base
        const [result] = await getConnection.query('INSERT INTO article (title, ingredient, content, category, image, idUser) VALUES (?, ?, ?, ?, ?, ?)', [title, ingredient, content, category, image || null, idUser]);

        // On retourne l'article nouvellement crée avec don ID généré automatiquement
        const newArticle = { id: result.insertId, title, ingredient, content, category, image, idUser };
        // Si des tags sont envoyés
        if (req.body.tags) {
            const tagIds = JSON.parse(req.body.tags); // tableau d'IDs de tags
            if (tagIds.length > 0) {
                const values = tagIds.map(tagId => [tagId, result.insertId]);
                await getConnection.query(
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
    const image = req.file ? req.file.filename : null;

    // Validation
    if (!title || !ingredient || !content || !category) return res.status(400).json({ message: 'Champs requis' });

    try {
        const getConnection = app.locals.db;

        // Récupérer l'article existant
        const [rows] = await getConnection.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);
        const article = rows[0];

        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        // Vérifier si auteur ou admin
        if (req.user.role !== 'admin' && article.idUser !== req.user.idUser) {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        // Mise à jour
        await getConnection.query(
            'UPDATE article SET title = ?, ingredient = ?, content = ?, category = ?, image = ? WHERE idArticle = ?',
            [title, ingredient, content, category, image || article.image, req.params.id]
        );

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
        const getConnection = app.locals.db;

        // Vérifier si l'article existe
        const [rows] = await getConnection.query('SELECT * FROM article WHERE idArticle = ?', [req.params.id]);
        const article = rows[0];

        // Suppression de l'article avec l'ID donné
        const [result] = await getConnection.query('DELETE FROM article WHERE idArticle = ?', [req.params.id]);

        if (!article) {
            // Aucun article supprimé = ID non trouvé
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        // Vérifier si auteur ou admin
        if (req.user.role !== 'admin' && article.idUser !== req.user.idUser) {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        await getConnection.query('DELETE FROM article WHERE idArticle = ?', [req.params.id]);
        res.status(204).send();

        // Suppression réussie, pas besoin de contenu en retour
        res.status(204).send(); // 204 = No Content
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


module.exports = router