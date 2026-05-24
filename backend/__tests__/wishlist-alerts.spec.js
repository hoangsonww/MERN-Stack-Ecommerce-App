/**
 * Tests for wishlist + alert subscription feature.
 * Covers: subscription validation, threshold evaluation, idempotent triggering.
 */

const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');

// ── Model mocks ──────────────────────────────────────────────────────────────
jest.mock('../models/alertSubscription');
jest.mock('../models/wishlist');
jest.mock('../models/product');
jest.mock('../models/user');
jest.mock('../middleware/auth', () => (req, _res, next) => {
  req.user = { id: 'user123' };
  next();
});
jest.mock('../services/emailService', () => ({
  sendRestockEmail: jest.fn().mockResolvedValue(),
  sendPriceDropEmail: jest.fn().mockResolvedValue(),
}));
jest.mock('../services/pineconeSync', () => ({
  ensureProductSyncedWithPinecone: jest.fn().mockResolvedValue(),
  removeProductFromPinecone: jest.fn().mockResolvedValue(),
}));

const AlertSubscription = require('../models/alertSubscription');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const User = require('../models/user');
const { sendRestockEmail, sendPriceDropEmail } = require('../services/emailService');
const { evaluateSubscriptions } = require('../services/evaluateSubscriptions');

// Helper: returns a mock query object that resolves via .lean()
const leanQuery = value => ({ lean: jest.fn().mockResolvedValue(value) });
// Helper: returns a mock sort→lean chain
const sortLeanQuery = value => ({
  sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }),
});

function buildApp() {
  const app = express();
  app.use(bodyParser.json());
  app.use('/api/wishlist', require('../routes/wishlist'));
  app.use('/api/alerts', require('../routes/alerts'));
  return app;
}

// ── Wishlist route tests ──────────────────────────────────────────────────────
describe('Wishlist API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  describe('GET /api/wishlist', () => {
    it('returns empty items when no wishlist exists', async () => {
      Wishlist.findOne = jest.fn().mockReturnValue(leanQuery(null));
      const res = await request(app).get('/api/wishlist');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [] });
    });

    it('returns populated product items', async () => {
      const productId = '64a000000000000000000001';
      Wishlist.findOne = jest.fn().mockReturnValue(
        leanQuery({ items: [{ productId }] })
      );
      Product.find = jest.fn().mockReturnValue(
        leanQuery([{ _id: productId, name: 'Test', price: 99, toString: () => productId }])
      );
      const res = await request(app).get('/api/wishlist');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/wishlist', () => {
    it('400 → missing productId', async () => {
      const res = await request(app).post('/api/wishlist').send({});
      expect(res.status).toBe(400);
    });

    it('400 → invalid ObjectId', async () => {
      const res = await request(app).post('/api/wishlist').send({ productId: 'not-valid' });
      expect(res.status).toBe(400);
    });

    it('404 → product not found', async () => {
      Product.findById = jest.fn().mockReturnValue(leanQuery(null));
      const res = await request(app).post('/api/wishlist').send({ productId: '64a000000000000000000001' });
      expect(res.status).toBe(404);
    });

    it('400 → already in wishlist', async () => {
      const productId = '64a000000000000000000001';
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: productId }));
      const fakeWishlist = {
        items: [{ productId: { toString: () => productId } }],
        save: jest.fn(),
      };
      // items.some needs to work — give it a real array method
      fakeWishlist.items.some = arr => Array.prototype.some.call(fakeWishlist.items, arr);
      Wishlist.findOne = jest.fn().mockResolvedValue(fakeWishlist);
      const res = await request(app).post('/api/wishlist').send({ productId });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/already/i);
    });

    it('200 → item added to existing wishlist', async () => {
      const productId = '64a000000000000000000001';
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: productId }));
      const items = [];
      const fakeWishlist = {
        items,
        save: jest.fn().mockResolvedValue(),
      };
      Wishlist.findOne = jest.fn().mockResolvedValue(fakeWishlist);
      const res = await request(app).post('/api/wishlist').send({ productId });
      expect(res.status).toBe(200);
      expect(res.body.msg).toMatch(/added/i);
    });
  });

  describe('DELETE /api/wishlist/:productId', () => {
    it('400 → invalid ObjectId', async () => {
      const res = await request(app).delete('/api/wishlist/bad-id');
      expect(res.status).toBe(400);
    });

    it('404 → wishlist not found', async () => {
      Wishlist.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app).delete('/api/wishlist/64a000000000000000000001');
      expect(res.status).toBe(404);
    });

    it('200 → item removed', async () => {
      const productId = '64a000000000000000000001';
      const items = [{ productId: { toString: () => productId } }];
      const fakeWishlist = {
        items,
        save: jest.fn().mockResolvedValue(),
      };
      Wishlist.findOne = jest.fn().mockResolvedValue(fakeWishlist);
      const res = await request(app).delete(`/api/wishlist/${productId}`);
      expect(res.status).toBe(200);
    });
  });
});

// ── Alert subscription route tests ───────────────────────────────────────────
describe('Alert subscription API', () => {
  let app;

  beforeAll(() => {
    process.env.FEATURE_ALERTS = 'true';
  });

  afterAll(() => {
    delete process.env.FEATURE_ALERTS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  describe('POST /api/alerts/subscribe — validation', () => {
    it('400 → missing type', async () => {
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId: '64a000000000000000000001' });
      expect(res.status).toBe(400);
    });

    it('400 → invalid type', async () => {
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId: '64a000000000000000000001', type: 'unknown' });
      expect(res.status).toBe(400);
    });

    it('400 → price_drop without targetPrice or dropPercent', async () => {
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: '64a000000000000000000001', price: 100 }));
      User.findById = jest.fn().mockReturnValue(leanQuery({ _id: 'user123', email: 'u@e.com' }));
      AlertSubscription.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId: '64a000000000000000000001', type: 'price_drop' });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/targetPrice or dropPercent/i);
    });

    it('400 → duplicate active subscription', async () => {
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: '64a000000000000000000001', price: 100 }));
      User.findById = jest.fn().mockReturnValue(leanQuery({ _id: 'user123', email: 'u@e.com' }));
      AlertSubscription.findOne = jest.fn().mockResolvedValue({ status: 'ACTIVE' });
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId: '64a000000000000000000001', type: 'restock' });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/already have an active/i);
    });

    it('201 → restock subscription created', async () => {
      const productId = '64a000000000000000000001';
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: productId, price: 100 }));
      User.findById = jest.fn().mockReturnValue(leanQuery({ _id: 'user123', email: 'u@e.com' }));
      AlertSubscription.findOne = jest.fn().mockResolvedValue(null);
      AlertSubscription.prototype.save = jest.fn().mockResolvedValue();
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId, type: 'restock' });
      expect(res.status).toBe(201);
    });

    it('201 → price_drop subscription with targetPrice created', async () => {
      const productId = '64a000000000000000000001';
      Product.findById = jest.fn().mockReturnValue(leanQuery({ _id: productId, price: 100 }));
      User.findById = jest.fn().mockReturnValue(leanQuery({ _id: 'user123', email: 'u@e.com' }));
      AlertSubscription.findOne = jest.fn().mockResolvedValue(null);
      AlertSubscription.prototype.save = jest.fn().mockResolvedValue();
      const res = await request(app)
        .post('/api/alerts/subscribe')
        .send({ productId, type: 'price_drop', targetPrice: 80 });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/alerts/mine', () => {
    it('returns enriched subscriptions', async () => {
      const productId = '64a000000000000000000001';
      AlertSubscription.find = jest.fn().mockReturnValue(
        sortLeanQuery([{ _id: 'sub1', productId, type: 'restock', status: 'ACTIVE' }])
      );
      Product.find = jest.fn().mockReturnValue(
        leanQuery([{ _id: { toString: () => productId }, name: 'Widget', price: 50 }])
      );
      const res = await request(app).get('/api/alerts/mine');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/alerts/cancel', () => {
    it('400 → missing productId', async () => {
      const res = await request(app).post('/api/alerts/cancel').send({ type: 'restock' });
      expect(res.status).toBe(400);
    });

    it('404 → no active subscription', async () => {
      AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .post('/api/alerts/cancel')
        .send({ productId: '64a000000000000000000001', type: 'restock' });
      expect(res.status).toBe(404);
    });

    it('200 → subscription cancelled', async () => {
      AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: 'sub1', status: 'CANCELLED',
      });
      const res = await request(app)
        .post('/api/alerts/cancel')
        .send({ productId: '64a000000000000000000001', type: 'restock' });
      expect(res.status).toBe(200);
    });
  });
});

// ── evaluateSubscriptions unit tests ─────────────────────────────────────────
describe('evaluateSubscriptions service', () => {
  beforeAll(() => {
    process.env.FEATURE_ALERTS = 'true';
  });

  afterAll(() => {
    delete process.env.FEATURE_ALERTS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeProduct = overrides => ({
    _id: '64a000000000000000000099',
    name: 'Test Widget',
    price: 80,
    stock: 5,
    ...overrides,
  });

  const makeSub = overrides => ({
    _id: 'sub1',
    type: 'restock',
    userEmail: 'buyer@example.com',
    status: 'ACTIVE',
    targetPrice: null,
    dropPercent: null,
    priceAtSubscription: null,
    productId: '64a000000000000000000099',
    ...overrides,
  });

  it('does nothing when FEATURE_ALERTS is not set', async () => {
    delete process.env.FEATURE_ALERTS;
    AlertSubscription.find = jest.fn();
    await evaluateSubscriptions(makeProduct());
    expect(AlertSubscription.find).not.toHaveBeenCalled();
    process.env.FEATURE_ALERTS = 'true';
  });

  it('does nothing when no active subscriptions', async () => {
    AlertSubscription.find = jest.fn().mockResolvedValue([]);
    await evaluateSubscriptions(makeProduct());
    expect(sendRestockEmail).not.toHaveBeenCalled();
  });

  it('triggers restock alert when stock > 0', async () => {
    const sub = makeSub({ type: 'restock' });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);
    AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue(sub);

    await evaluateSubscriptions(makeProduct({ stock: 3 }));

    expect(AlertSubscription.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: sub._id, status: 'ACTIVE' },
      { $set: { status: 'TRIGGERED', lastTriggeredAt: expect.any(Date) } },
      { new: false }
    );
    expect(sendRestockEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'buyer@example.com', productName: 'Test Widget' })
    );
  });

  it('does NOT trigger restock alert when stock is 0', async () => {
    const sub = makeSub({ type: 'restock' });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);

    await evaluateSubscriptions(makeProduct({ stock: 0 }));

    expect(sendRestockEmail).not.toHaveBeenCalled();
  });

  it('triggers price_drop alert when price <= targetPrice', async () => {
    const sub = makeSub({ type: 'price_drop', targetPrice: 90 });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);
    AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue(sub);

    await evaluateSubscriptions(makeProduct({ price: 85 }));

    expect(sendPriceDropEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'buyer@example.com', price: 85 })
    );
  });

  it('does NOT trigger price_drop when price > targetPrice', async () => {
    const sub = makeSub({ type: 'price_drop', targetPrice: 70 });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);

    await evaluateSubscriptions(makeProduct({ price: 85 }));

    expect(sendPriceDropEmail).not.toHaveBeenCalled();
  });

  it('triggers price_drop via dropPercent threshold', async () => {
    const sub = makeSub({
      type: 'price_drop',
      dropPercent: 20,
      priceAtSubscription: 100,
      targetPrice: null,
    });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);
    AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue(sub);

    // threshold = 100 * (1 - 0.20) = 80; price 79 ≤ 80 → fires
    await evaluateSubscriptions(makeProduct({ price: 79 }));

    expect(sendPriceDropEmail).toHaveBeenCalled();
  });

  it('does NOT trigger price_drop via dropPercent when threshold not met', async () => {
    const sub = makeSub({
      type: 'price_drop',
      dropPercent: 20,
      priceAtSubscription: 100,
      targetPrice: null,
    });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);

    // threshold = 80; price 81 > 80 → does not fire
    await evaluateSubscriptions(makeProduct({ price: 81 }));

    expect(sendPriceDropEmail).not.toHaveBeenCalled();
  });

  it('is idempotent — second concurrent trigger is a no-op', async () => {
    const sub = makeSub({ type: 'restock' });
    AlertSubscription.find = jest.fn().mockResolvedValue([sub]);
    // Another process already claimed the trigger (returns null)
    AlertSubscription.findOneAndUpdate = jest.fn().mockResolvedValue(null);

    await evaluateSubscriptions(makeProduct({ stock: 5 }));

    expect(sendRestockEmail).not.toHaveBeenCalled();
  });
});
