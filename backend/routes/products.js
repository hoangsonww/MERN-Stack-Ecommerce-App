require('dotenv').config();
const express = require('express');
const router = express.Router();
const Product = require('../models/product');

const { default: weaviate, ApiKey } = require('weaviate-ts-client');
const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_HOST,
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: The description of the product
 *         price:
 *           type: number
 *           description: The price of the product
 *         category:
 *           type: string
 *           description: The category of the product
 *         image:
 *           type: string
 *           description: The image URL of the product
 *         brand:
 *           type: string
 *           description: The brand of the product
 *         stock:
 *           type: number
 *           description: The available stock of the product
 *         rating:
 *           type: number
 *           description: The rating of the product
 *         numReviews:
 *           type: number
 *           description: The number of reviews of the product
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the product was created
 *       example:
 *         id: "66d9e7ee8bf3a567a5efe26b"
 *         name: "Product Name"
 *         description: "Product Description"
 *         price: 19.99
 *         category: "Electronics"
 *         image: "https://example.com/product.jpg"
 *         brand: "Brand Name"
 *         stock: 10
 *         rating: 4.5
 *         numReviews: 10
 *         createdAt: "2022-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Returns the list of all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: The list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id,
    }));

    res.json(formattedProducts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/products/{id}/similar:
 *   get:
 *     summary: Get recommended similar products for a given product ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The MongoDB product _id
 *     responses:
 *       200:
 *         description: A list of similar products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found or not indexed for recommendations
 *       500:
 *         description: Server error
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id).lean();
    if (!prod || !prod.weaviateId) {
      return res.status(404).json({ message: 'Product not found or not indexed in Weaviate' });
    }

    const vecResp = await client.graphql
      .get()
      .withClassName('Product')
      .withFields('_additional { vector }')
      .withWhere({
        path: ['id'],
        operator: 'Equal',
        valueString: prod.weaviateId,
      })
      .withLimit(1)
      .do();

    const objs = vecResp.data.Get.Product;
    if (!objs.length || !objs[0]._additional.vector) {
      return res.status(404).json({ message: 'No vector found for this product in Weaviate' });
    }
    const vector = objs[0]._additional.vector;

    const simResp = await client.graphql
      .get()
      .withClassName('Product')
      .withFields(
        `
        _additional { id }
      `
      )
      .withNearVector({ vector })
      .withLimit(5)
      .do();

    const hits = simResp.data.Get.Product;
    if (!hits.length) return res.json([]);

    const weaviateIds = hits.map(h => h._additional.id);
    const recs = await Product.find({ weaviateId: { $in: weaviateIds } }).lean();

    const ordered = weaviateIds
      .map(wid => recs.find(r => r.weaviateId === wid))
      .filter(Boolean)
      .map(r => ({
        id: r._id,
        name: r.name,
        description: r.description,
        price: r.price,
        category: r.category,
        image: r.image,
        brand: r.brand,
        stock: r.stock,
        rating: r.rating,
        numReviews: r.numReviews,
        createdAt: r.createdAt,
      }));

    res.json(ordered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/recommendations:
 *   post:
 *     summary: Get recommendations based on multiple products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of MongoDB product _id strings
 *             example:
 *               ids: ["607d1f77bcf86cd799439011","607d1f77bcf86cd799439022"]
 *     responses:
 *       200:
 *         description: A list of recommended products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request (missing or invalid ids)
 *       500:
 *         description: Server error
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Request body must have a non-empty array of ids' });
    }

    const docs = await Product.find({ _id: { $in: ids } }).lean();
    if (docs.length === 0) {
      return res.status(400).json({ message: 'No products found for provided ids' });
    }

    const vectors = [];
    for (const doc of docs) {
      if (!doc.weaviateId) continue;
      const vecResp = await client.graphql
        .get()
        .withClassName('Product')
        .withFields('_additional { vector }')
        .withWhere({
          path: ['id'],
          operator: 'Equal',
          valueString: doc.weaviateId,
        })
        .withLimit(1)
        .do();
      const arr = vecResp.data.Get.Product;
      if (arr.length && arr[0]._additional.vector) {
        vectors.push(arr[0]._additional.vector);
      }
    }

    if (vectors.length === 0) {
      return res.status(404).json({ message: 'None of the products have vectors in Weaviate' });
    }

    const dim = vectors[0].length;
    const centroid = Array(dim).fill(0);
    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) centroid[i] += vec[i];
    }
    for (let i = 0; i < dim; i++) centroid[i] /= vectors.length;

    const simResp = await client.graphql
      .get()
      .withClassName('Product')
      .withFields('_additional { id }')
      .withNearVector({ vector: centroid })
      .withLimit(10)
      .do();

    const hits = simResp.data.Get.Product.map(h => h._additional.id);

    // 5️⃣ Exclude originals
    const filtered = hits.filter(wid => !docs.find(d => d.weaviateId === wid));
    if (filtered.length === 0) return res.json([]);

    // 6️⃣ Fetch full Mongo docs
    const recs = await Product.find({ weaviateId: { $in: filtered } }).lean();

    // 7️⃣ Order to match ranking
    const ordered = filtered
      .map(wid => recs.find(r => r.weaviateId === wid))
      .filter(Boolean)
      .map(r => ({
        id: r._id,
        name: r.name,
        description: r.description,
        price: r.price,
        category: r.category,
        image: r.image,
        brand: r.brand,
        stock: r.stock,
        rating: r.rating,
        numReviews: r.numReviews,
        createdAt: r.createdAt,
      }));

    res.json(ordered);
  } catch (err) {
    console.error('Error in /recommendations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product id
 *     responses:
 *       200:
 *         description: The product description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    res.json(product);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: The product category
 *     responses:
 *       200:
 *         description: The products by category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/products/{id}/rating:
 *   put:
 *     summary: Update the product rating
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 description: The new rating for the product
 *     responses:
 *       200:
 *         description: The updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.put('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Calculate new average rating
    const newNumReviews = product.numReviews + 1;
    const newRatingSum = product.rating * product.numReviews + rating;
    const newAverageRating = newRatingSum / newNumReviews;

    // Update product with the new average rating and review count
    product.rating = newAverageRating;
    product.numReviews = newNumReviews;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
