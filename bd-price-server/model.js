const mongoose = require('mongoose');

// Configurable TTL for history entries (defaults to 90 days, min 7 days)
const ttlDays = Math.max(parseInt(process.env.HISTORY_TTL_DAYS || '90', 10), 7);
const HISTORY_TTL_SECONDS = ttlDays * 24 * 60 * 60;

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
    dayKey: { type: String, required: true }, // YYYY-MM-DD to bucket per day
    date: { type: Date, default: Date.now }
});

// TTL Index to auto-delete older history
historySchema.index({ date: 1 }, { expireAfterSeconds: HISTORY_TTL_SECONDS });
// Uniqueness per product per day
historySchema.index({ productUrl: 1, dayKey: 1 }, { unique: true });
// Index for fast queries
historySchema.index({ productUrl: 1, date: -1 });

const Product = mongoose.model('Product', productSchema);
const History = mongoose.model('History', historySchema);

module.exports = { Product, History };