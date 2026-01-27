const mongoose = require('mongoose');

// 1. PRODUCT SCHEMA
const productSchema = new mongoose.Schema({
    // Store as 'u', access as 'url'
    u: { type: String, required: true, unique: true, alias: 'url' }, 
    t: { type: String, alias: 'title' },
    i: { type: String, alias: 'image' },
    s: { type: String, alias: 'site' },
    d: { type: Date, default: Date.now, alias: 'lastUpdated' }
});

// 2. HISTORY SCHEMA
const historySchema = new mongoose.Schema({
    pid: { type: String, required: true, ref: 'Product', alias: 'productUrl' }, 
    p: { type: Number, required: true, alias: 'price' },
    
    // 1. The Date Field
    d: { type: Date, default: Date.now, alias: 'date' }
});

// 2. CREATE THE CLEANUP RULE
// expireAfterSeconds: 31536000 = 1 Year (60s * 60m * 24h * 365d)
// MongoDB runs a background job every 60 seconds to delete old entries.
historySchema.index({ d: 1 }, { expireAfterSeconds: 31536000 });
// (Keep your existing index too)
historySchema.index({ pid: 1, d: -1 });

const Product = mongoose.model('Product', productSchema);
const History = mongoose.model('History', historySchema);

module.exports = { Product, History };