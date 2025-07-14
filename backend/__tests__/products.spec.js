const express    = require('express');
const bodyParser = require('body-parser');
const request    = require('supertest');

jest.mock('../models/product');
const Product = require('../models/product');

jest.mock('weaviate-ts-client', () => {
  const chain = {
    withClassName: () => chain,
    withFields:    () => chain,
    withWhere:     () => chain,
    withNearVector:() => chain,
    withNearObject:() => chain,
    withLimit:     () => chain,
    do: async () => ({ data: { Get: { Product: [] } } }),
  };

  // client factory returns an object with .graphql.get()
  function client() {
    return { graphql: { get: () => chain } };
  }

  return {
    client,
    ApiKey: class MockApiKey {},
    default: { client }
  };
});

const productsRouter = require('../routes/products');

describe('Products API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/products', productsRouter);
  });

  describe('GET /api/products', () => {
    it('200 → returns all products formatted with id', async () => {
      const fakeDocs = [
        { _id: '1', name: 'A', toObject: () => ({ name: 'A', price: 10 }) },
        { _id: '2', name: 'B', toObject: () => ({ name: 'B', price: 20 }) },
      ];
      Product.find.mockResolvedValue(fakeDocs);

      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { name: 'A', price: 10, id: '1' },
        { name: 'B', price: 20, id: '2' },
      ]);
    });

    it('500 → server error', async () => {
      Product.find.mockRejectedValue(new Error('db fail'));
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(500);
      expect(res.text).toBe('Server error');
    });
  });

  describe('GET /api/products/:id', () => {
    it('200 → returns product when found', async () => {
      const fakeProduct = { _id: '123', name: 'X', price: 5 };
      Product.findById.mockResolvedValue(fakeProduct);

      const res = await request(app).get('/api/products/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeProduct);
    });

    it('404 → product not found', async () => {
      Product.findById.mockResolvedValue(null);
      const res = await request(app).get('/api/products/doesnotexist');
      expect(res.status).toBe(404);
      expect(res.text).toBe('Product not found');
    });

    it('500 → server error', async () => {
      Product.findById.mockRejectedValue(new Error('oops'));
      const res = await request(app).get('/api/products/123');
      expect(res.status).toBe(500);
      expect(res.text).toBe('Server error');
    });
  });

  describe('GET /api/products/category/:category', () => {
    it('200 → returns products in category', async () => {
      const catProds = [{ _id: 'a', name: 'Foo' }, { _id: 'b', name: 'Bar' }];
      Product.find.mockResolvedValue(catProds);

      const res = await request(app).get('/api/products/category/testcat');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(catProds);
      expect(Product.find).toHaveBeenCalledWith({ category: 'testcat' });
    });

    it('500 → server error', async () => {
      Product.find.mockRejectedValue(new Error('db error'));
      const res = await request(app).get('/api/products/category/anything');
      expect(res.status).toBe(500);
      expect(res.text).toBe('Server error');
    });
  });

  describe('PUT /api/products/:id/rating', () => {
    it('200 → updates rating when product exists', async () => {
      const original = {
        _id: 'z1',
        rating: 4,
        numReviews: 2,
        save: jest.fn().mockResolvedValue(),
      };
      Product.findById.mockResolvedValue(original);

      const res = await request(app)
        .put('/api/products/z1/rating')
        .send({ rating: 5 });

      // newAverage = (4*2 + 5) / 3 = 13/3 ≈ 4.333...
      expect(res.status).toBe(200);
      expect(original.save).toHaveBeenCalled();
      expect(res.body).toEqual({
        _id: 'z1',
        rating: expect.closeTo(13 / 3, 5),
        numReviews: 3,
      });
    });

    it('404 → product not found', async () => {
      Product.findById.mockResolvedValue(null);
      const res = await request(app)
        .put('/api/products/nope/rating')
        .send({ rating: 1 });
      expect(res.status).toBe(404);
      expect(res.text).toBe('Product not found');
    });

    it('500 → server error', async () => {
      Product.findById.mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .put('/api/products/err/rating')
        .send({ rating: 2 });
      expect(res.status).toBe(500);
      expect(res.text).toBe('Server error');
    });
  });
});
