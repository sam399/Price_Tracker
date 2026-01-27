// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Product, History } = require('./model');

const PORT = parseInt(process.env.PORT || '3000', 10);
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    throw new Error('MONGO_URI is required');
}

// Allow specific origins if provided, otherwise allow extension/local callers
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const corsOptions = allowedOrigins.length === 0 ? {} : {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow curl / local
        const isAllowed = allowedOrigins.includes(origin);
        callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
    }
};

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send('Server is running! 🚀');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// 1. CONNECT TO MONGODB
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Database Connected Successfully!"))
    .catch(err => {
        console.error("❌ Database Connection Error:", err);
        process.exit(1);
    });

// 2. API: SYNC PRICE (Extension sends data here)
app.post('/api/sync', async (req, res) => {
    try {
        const { url, title, price, image } = req.body;

        if (!url) {
            return res.status(400).json({ error: "Missing url" });
        }

        const priceNumber = Number(price);
        if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
            return res.status(400).json({ error: "Invalid price" });
        }

        const now = new Date();
        const dayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

        // A. Update or Create the Product
        await Product.findOneAndUpdate(
            { url: url }, 
            { 
                url,
                title,
                image,
                lastUpdated: now
            },
            { upsert: true, new: true }
        );

        // B. Upsert one entry per product per day
        await History.updateOne(
            { productUrl: url, dayKey },
            { $set: { productUrl: url, dayKey, price: priceNumber, date: now } },
            { upsert: true }
        );

        // C. Cap history per product to avoid unbounded growth
        const maxEntries = parseInt(process.env.HISTORY_MAX_PER_PRODUCT || '120', 10);
        if (maxEntries > 0) {
            const oldIds = await History.find({ productUrl: url })
                .sort({ date: -1 })
                .skip(maxEntries)
                .select('_id');
            if (oldIds.length) {
                await History.deleteMany({ _id: { $in: oldIds.map(doc => doc._id) } });
            }
        }

        console.log(`💾 Saved: ৳${priceNumber} for ${title ? title.substring(0, 30) : url}`);
        res.json({ success: true, message: "Price saved to Cloud DB" });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 3. API: GET HISTORY (For the graph)
app.get('/api/history', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url parameter" });

    try {
        const history = await History.find({ productUrl: url })
            .sort({ date: 1 })
            .limit(100);
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

// Start Server
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
    console.log('Shutting down...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            process.exit(0);
        });
    });
}