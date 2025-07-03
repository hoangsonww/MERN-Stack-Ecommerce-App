const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');

const checkoutRouter = require('../routes/checkout');

describe('POST /api/checkout/create-order', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/checkout', checkoutRouter);
  });

  it('400 → missing required fields', async () => {
    const res = await request(app)
      .post('/api/checkout/create-order')
      .send({
        // missing most fields
        items: [],
        email: 'a@b.com',
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing required fields' });
  });

  it('400 → invalid email format', async () => {
    const payload = {
      items: [{ productId: 'p1', quantity: 1 }],
      name: 'Test',
      email: 'invalid-email',
      shippingAddress: 'Addr',
      cardNumber: '4111111111111111',
      cardName: 'Test',
      expiry: '01/23',
      cvc: '123',
    };
    const res = await request(app)
      .post('/api/checkout/create-order')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid email format' });
  });

  it('400 → invalid card number', async () => {
    const payload = {
      items: [{ productId: 'p1', quantity: 1 }],
      name: 'Test',
      email: 't@e.com',
      shippingAddress: 'Addr',
      cardNumber: '1234',
      cardName: 'Test',
      expiry: '01/23',
      cvc: '123',
    };
    const res = await request(app)
      .post('/api/checkout/create-order')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid card number' });
  });

  it('400 → invalid expiry date', async () => {
    const payload = {
      items: [{ productId: 'p1', quantity: 1 }],
      name: 'Test',
      email: 't@e.com',
      shippingAddress: 'Addr',
      cardNumber: '4111111111111111',
      cardName: 'Test',
      expiry: '13/99',
      cvc: '123',
    };
    const res = await request(app)
      .post('/api/checkout/create-order')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid expiry date' });
  });

  it('400 → invalid CVC', async () => {
    const payload = {
      items: [{ productId: 'p1', quantity: 1 }],
      name: 'Test',
      email: 't@e.com',
      shippingAddress: 'Addr',
      cardNumber: '4111111111111111',
      cardName: 'Test',
      expiry: '01/23',
      cvc: '12', // too short
    };
    const res = await request(app)
      .post('/api/checkout/create-order')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid CVC' });
  });
});
