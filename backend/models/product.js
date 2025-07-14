const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,    // assuming names are unique
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    brand: String,
    stock: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // ← NEW optional Weaviate UUID
    weaviateId: {
        type: String,
        unique: true,
        sparse: true,
    },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
