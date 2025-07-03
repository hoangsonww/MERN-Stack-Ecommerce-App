const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');

jest.mock('../models/product');
const Product = require('../models/product');
const searchRouter = require('../routes/search');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Search API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/search', searchRouter);
  });

  it('200 → returns products matching the query', async () => {
    const fakeProducts = [
      { _id: '1', name: 'FooBar', description: 'Test product', price: 10 },
      { _id: '2', name: 'BarBaz', description: 'Another test', price: 20 },
    ];
    Product.find.mockResolvedValue(fakeProducts);

    const res = await request(app).get('/api/search?q=bar');

    expect(res.status).toBe(200);
    expect(Product.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'bar', $options: 'i' } },
        { description: { $regex: 'bar', $options: 'i' } },
      ],
    });
    expect(res.body).toEqual(fakeProducts);
  });

  it('200 → returns all products when no query is provided', async () => {
    const allProducts = [
      { _id: 'a', name: 'Alpha', description: 'Desc A', price: 5 },
      { _id: 'b', name: 'Beta', description: 'Desc B', price: 15 },
    ];
    Product.find.mockResolvedValue(allProducts);

    const res = await request(app).get('/api/search');

    expect(res.status).toBe(200);
    expect(Product.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: undefined, $options: 'i' } },
        { description: { $regex: undefined, $options: 'i' } },
      ],
    });
    expect(res.body).toEqual(allProducts);
  });

  it('500 → internal server error', async () => {
    Product.find.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'An error occurred during the search.' });
  });
});
