const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.get('/', async (req, res) => {
    try {
        const query = req.query.q;

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });

        res.json(products);
    }
    catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({ error: 'An error occurred during the search.' });
    }
});

module.exports = router;
