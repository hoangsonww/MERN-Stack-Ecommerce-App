const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const AlertSubscription = require('../models/alertSubscription');
const Product = require('../models/product');
const User = require('../models/user');

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Restock and price-drop notification subscriptions
 */

/**
 * @swagger
 * /api/alerts/subscribe:
 *   post:
 *     summary: Subscribe to a restock or price-drop alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertSubscribeRequest'
 *     responses:
 *       201:
 *         description: Subscription created
 *       400:
 *         description: Validation error or duplicate
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/subscribe',
  auth,
  [
    check('productId', 'productId is required').not().isEmpty(),
    check('type', 'type must be restock or price_drop').isIn(['restock', 'price_drop']),
    check('targetPrice').optional().isFloat({ min: 0 }).withMessage('targetPrice must be a non-negative number'),
    check('dropPercent').optional().isFloat({ min: 1, max: 99 }).withMessage('dropPercent must be between 1 and 99'),
  ],
  async (req, res) => {
    if (process.env.FEATURE_ALERTS !== 'true') {
      return res.status(404).json({ msg: 'Alerts feature is not enabled' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productId, type, targetPrice, dropPercent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: 'Invalid productId' });
    }

    if (type === 'price_drop' && targetPrice == null && dropPercent == null) {
      return res.status(400).json({ msg: 'price_drop alert requires targetPrice or dropPercent' });
    }

    try {
      const product = await Product.findById(productId).lean();
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      const user = await User.findById(req.user.id).lean();
      if (!user) return res.status(404).json({ msg: 'User not found' });

      // Upsert: reactivate a cancelled/triggered sub or create fresh
      const existing = await AlertSubscription.findOne({
        userId: req.user.id,
        productId,
        type,
      });

      if (existing) {
        if (existing.status === 'ACTIVE') {
          return res.status(400).json({ msg: 'You already have an active alert for this product and type' });
        }
        existing.status = 'ACTIVE';
        existing.lastTriggeredAt = null;
        existing.targetPrice = targetPrice ?? null;
        existing.dropPercent = dropPercent ?? null;
        existing.priceAtSubscription = type === 'price_drop' ? product.price : null;
        await existing.save();
        return res.status(201).json({ msg: 'Alert reactivated', subscription: existing });
      }

      const sub = new AlertSubscription({
        userId: req.user.id,
        productId,
        userEmail: user.email,
        type,
        targetPrice: targetPrice ?? null,
        dropPercent: dropPercent ?? null,
        priceAtSubscription: type === 'price_drop' ? product.price : null,
      });

      await sub.save();
      res.status(201).json({ msg: 'Alert subscription created', subscription: sub });
    } catch (err) {
      console.error('POST /api/alerts/subscribe error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/alerts/cancel:
 *   post:
 *     summary: Cancel an active alert subscription
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type]
 *             properties:
 *               productId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [restock, price_drop]
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cancel', auth, async (req, res) => {
  if (process.env.FEATURE_ALERTS !== 'true') {
    return res.status(404).json({ msg: 'Alerts feature is not enabled' });
  }

  const { productId, type } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ msg: 'Invalid productId' });
  }
  if (!['restock', 'price_drop'].includes(type)) {
    return res.status(400).json({ msg: 'type must be restock or price_drop' });
  }

  try {
    const sub = await AlertSubscription.findOneAndUpdate(
      { userId: req.user.id, productId, type, status: 'ACTIVE' },
      { $set: { status: 'CANCELLED' } },
      { new: true }
    );

    if (!sub) return res.status(404).json({ msg: 'Active subscription not found' });

    res.json({ msg: 'Alert cancelled', subscription: sub });
  } catch (err) {
    console.error('POST /api/alerts/cancel error:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/alerts/mine:
 *   get:
 *     summary: List all alert subscriptions for the current user
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of subscriptions with product details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/mine', auth, async (req, res) => {
  if (process.env.FEATURE_ALERTS !== 'true') {
    return res.status(404).json({ msg: 'Alerts feature is not enabled' });
  }

  try {
    const subs = await AlertSubscription.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = [...new Set(subs.map(s => s.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const enriched = subs.map(s => ({
      ...s,
      product: productMap.get(s.productId.toString()) || null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('GET /api/alerts/mine error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
