const express = require('express');
const router = express.Router();
const pool = require('../services/connection');



// Récupérer un tag par son ID

router.get('/:id', async (req, res) => {

    try {
        // Requête SQL avec un paramètre (sécurisé avec ?)
        const [rows] = await pool.query('SELECT * FROM tag WHERE idTag = ?', [req.params.id]);

        if (rows.length === 0) {
            // Si aucun tag trouvé avec cet ID, on retourne une erreur 404
            return res.status(404).json({ message: 'Tag non trouvé' });
        }

        res.json(rows[0]); // On retourne le tag trouvé
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Récupérer tous les tags

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tag');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Créer un nouveau tag

router.post('/', async (req, res) => {
    const { name } = req.body;

    // Validation : on vérifie que le nom est fourni
    if (!name) return res.status(400).json({ message: 'Nom requis' });

    try {
        // Requête pour insérer un nouveau tag dans la base
        const [result] = await pool.query('INSERT INTO tag (name) VALUES (?)', [name]);

        // On retourne le tag nouvellement crée avec don ID généré automatiquement
        const newTag = { idTag: result.insertId, name };
        res.status(201).json(newTag); // 201 = Created
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Modifier un tag existant

router.put('/:id', async (req, res) => {
    const { name } = req.body;

    // Validation
    if (!name) return res.status(400).json({ message: 'Nom requis' });

    try {
        // On met à jour le tag dont l'id est fourni
        const [result] = await pool.query('UPDATE tag SET name = ? WHERE idTag = ?', [name, req.params.id]);


        if (result.affectedRows === 0) {
            // Aucun tag mis à jour : l'ID n'existe pas
            return res.status(404).json({ message: 'Tag non trouvé' });
        }

        // On retourne le tag modifié (nouvelle valeur)
        res.json({ id: parseInt(req.params.id), name });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// Supprimer un tag par ID

router.delete('/:id', async (req, res) => {
    try {
        // Suppression du tag avec l'ID donné
        const [result] = await pool.query('DELETE FROM tag WHERE idTag = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            // Aucun tag supprimé = ID non trouvé
            return res.status(404).json({ message: 'Tag non trouvé' });
        }

        // Suppression réussie, pas besoin de contenu en retour
        res.status(204).send(); // 204 = No Content
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;