const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Save and manage wished products
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist with populated product details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id }).lean();
    if (!wishlist) return res.json({ items: [] });

    const productIds = wishlist.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const items = wishlist.items
      .map(i => productMap.get(i.productId.toString()))
      .filter(Boolean);

    res.json({ items });
  } catch (err) {
    console.error('GET /api/wishlist error:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added
 *       400:
 *         description: Invalid or already in wishlist
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: 'Invalid productId' });
    }

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, items: [] });
    }

    const alreadyIn = wishlist.items.some(i => i.productId.toString() === productId);
    if (alreadyIn) {
      return res.status(400).json({ msg: 'Product already in wishlist' });
    }

    wishlist.items.push({ productId });
    await wishlist.save();

    res.json({ msg: 'Added to wishlist', count: wishlist.items.length });
  } catch (err) {
    console.error('POST /api/wishlist error:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       400:
 *         description: Invalid productId
 *       404:
 *         description: Wishlist or item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: 'Invalid productId' });
    }

    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });

    const before = wishlist.items.length;
    wishlist.items = wishlist.items.filter(i => i.productId.toString() !== productId);

    if (wishlist.items.length === before) {
      return res.status(404).json({ msg: 'Item not in wishlist' });
    }

    await wishlist.save();
    res.json({ msg: 'Removed from wishlist', count: wishlist.items.length });
  } catch (err) {
    console.error('DELETE /api/wishlist/:productId error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
