const express = require('express');
const router = express.Router();

router.post('/create-order', async (req, res) => {
    try {
        const { items, name, email, shippingAddress, cardNumber, cardName, expiry, cvc } = req.body;

        if (!items || !name || !email || !shippingAddress || !cardNumber || !cardName || !expiry || !cvc) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!/^\d{16}$/.test(cardNumber)) {
            return res.status(400).json({ error: 'Invalid card number' });
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
            return res.status(400).json({ error: 'Invalid expiry date' });
        }

        if (!/^\d{3,4}$/.test(cvc)) {
            return res.status(400).json({ error: 'Invalid CVC' });
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        res.status(201).json({ message: 'Order created successfully!' });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

module.exports = router;
