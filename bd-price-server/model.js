const mongoose = require('mongoose');

// 1. PRODUCT SCHEMA - Simplified for upsert compatibility
const productSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    title: { type: String },
    image: { type: String },
    site: { type: String },
    lastUpdated: { type: Date, default: Date.now }
});

// 2. HISTORY SCHEMA - Simplified
const historySchema = new mongoose.Schema({
    productUrl: { type: String, required: true, ref: 'Product' },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

// TTL Index: Auto-delete entries older than 1 year (31536000 seconds)
historySchema.index({ date: 1 }, { expireAfterSeconds: 31536000 });
// Index for fast queries
historySchema.index({ productUrl: 1, date: -1 });

const Product = mongoose.model('Product', productSchema);
const History = mongoose.model('History', historySchema);

module.exports = { Product, History };

module.exports = { Product, History };