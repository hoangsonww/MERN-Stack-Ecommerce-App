const mongoose = require('mongoose');
const {
    ensureProductSyncedWithPinecone,
    removeProductFromPinecone,
} = require('../services/pineconeSync');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
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
    weaviateId: {
        type: String,
        unique: true,
        sparse: true,
    },
    pineconeId: {
        type: String,
        unique: true,
        sparse: true,
    },
});

const PINECONE_SYNC_FIELDS = ['name', 'description', 'category', 'brand', 'price', 'image'];

productSchema.pre('save', function(next) {
    this._shouldSyncPinecone = this.isNew || PINECONE_SYNC_FIELDS.some(field => this.isModified(field));
    next();
});

productSchema.post('save', function(doc, next) {
    const shouldSync = doc._shouldSyncPinecone;
    delete doc._shouldSyncPinecone;
    if (!shouldSync) return next();

    ensureProductSyncedWithPinecone(doc)
        .catch(err => {
            console.error('Pinecone sync (save) failed:', err);
        })
        .finally(() => next());
});

productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate() || {};
    const directUpdates = { ...update, ...(update.$set || {}) };
    const keys = Object.keys(directUpdates);
    this._shouldSyncPinecone = PINECONE_SYNC_FIELDS.some(field => keys.includes(field));
    next();
});

productSchema.post('findOneAndUpdate', function(doc, next) {
    const shouldSync = this._shouldSyncPinecone;
    delete this._shouldSyncPinecone;
    if (!shouldSync || !doc) return next();

    ensureProductSyncedWithPinecone(doc)
        .catch(err => {
            console.error('Pinecone sync (update) failed:', err);
        })
        .finally(() => next());
});

productSchema.post('deleteOne', { document: true, query: false }, function(next) {
    const id = this && this._id;
    if (!id) return next();
    removeProductFromPinecone(id)
        .catch(err => {
            console.error('Pinecone removal (deleteOne) failed:', err);
        })
        .finally(() => next());
});

productSchema.post('findOneAndDelete', function(doc, next) {
    if (!doc) return next();
    removeProductFromPinecone(doc._id)
        .catch(err => {
            console.error('Pinecone removal (findOneAndDelete) failed:', err);
        })
        .finally(() => next());
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
