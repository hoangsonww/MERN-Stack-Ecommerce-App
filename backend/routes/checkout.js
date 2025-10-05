const express = require('express');
const { randomInt } = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');

const router = express.Router();

const STATUS_FLOW = Order.STATUS_FLOW || [];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function generateOrderNumber() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = `FE-${randomInt(100000, 999999)}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) {
      return candidate;
    }
  }
  return `FE-${Date.now()}`;
}

/**
 * @swagger
 * /api/checkout/create-order:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new order with the provided details such as items, customer information, and payment details.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: The unique identifier of the product.
 *                     quantity:
 *                       type: integer
 *                       description: The number of items for this product.
 *               name:
 *                 type: string
 *                 description: Customer's name.
 *               email:
 *                 type: string
 *                 description: Customer's email address.
 *               shippingAddress:
 *                 type: string
 *                 description: Customer's shipping address.
 *               cardNumber:
 *                 type: string
 *                 description: Customer's card number.
 *               cardName:
 *                 type: string
 *                 description: Name on the customer's card.
 *               expiry:
 *                 type: string
 *                 description: Card expiry date in MM/YY format.
 *               cvc:
 *                 type: string
 *                 description: Card CVC.
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderNumber:
 *                   type: string
 *                   example: FE-482913
 *                 estimatedDelivery:
 *                   type: string
 *                   format: date-time
 *                 statusHistory:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderStatus'
 *                 statusFlow:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderStatus'
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       quantity:
 *                         type: integer
 *                 total:
 *                   type: number
 *                   format: float
 *       400:
 *         description: Bad request - Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Description of the error.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Description of the server error.
 */
router.post('/create-order', async (req, res) => {
  try {
    const { items, name, email, shippingAddress, cardNumber, cardName, expiry, cvc } = req.body;

    if (!Array.isArray(items) || !items.length || !name || !email || !shippingAddress || !cardNumber || !cardName || !expiry || !cvc) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const trimmedEmail = String(email).trim();
    const trimmedName = String(name).trim();
    const trimmedAddress = String(shippingAddress).trim();

    if (!trimmedName || !trimmedAddress) {
      return res.status(400).json({ error: 'Name and shipping address are required.' });
    }

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitizedCardNumber = String(cardNumber).replace(/\s+/g, '');
    const sanitizedExpiry = String(expiry).trim();
    const sanitizedCvc = String(cvc).trim();
    const trimmedCardName = String(cardName).trim();

    if (!trimmedCardName) {
      return res.status(400).json({ error: 'Name on card is required.' });
    }

    if (!/^\d{12,16}$/.test(sanitizedCardNumber)) {
      return res.status(400).json({ error: 'Invalid card number' });
    }

    if (!/^(0[1-9]|1[0-2])\/(?:\d{2}|\d{4})$/.test(sanitizedExpiry)) {
      return res.status(400).json({ error: 'Invalid expiry date' });
    }

    if (!/^\d{3,4}$/.test(sanitizedCvc)) {
      return res.status(400).json({ error: 'Invalid CVC' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const productId = item?.productId || item?.id;
      const quantity = Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: 'Invalid product reference in order payload.' });
      }

      normalizedItems.push({
        productId: String(productId),
        quantity,
      });
    }

    const productIds = [...new Set(normalizedItems.map(item => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products are no longer available.' });
    }

    const productMap = new Map(products.map(product => [String(product._id), product]));

    const orderItems = normalizedItems.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      };
    });

    const orderTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderNumber = await generateOrderNumber();
    const estimatedDelivery = new Date(Date.now() + randomInt(2, 6) * 24 * 60 * 60 * 1000);

    const order = new Order({
      orderNumber,
      email: trimmedEmail.toLowerCase(),
      name: trimmedName,
      shippingAddress: trimmedAddress,
      items: orderItems,
      total: orderTotal,
      estimatedDelivery,
    });

    order.ensureInitialStatus();

    await order.save();

    await new Promise(resolve => setTimeout(resolve, 1200));

    res.status(201).json({
      message: 'Order created successfully!',
      orderNumber,
      estimatedDelivery,
      statusHistory: order.statusHistory,
      statusFlow: STATUS_FLOW,
      items: orderItems,
      total: orderTotal,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
