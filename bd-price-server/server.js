// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Product, History } = require('./model');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your extension to talk to this server
app.get('/', (req, res) => {
    res.send('Server is running! 🚀');
});

// 1. CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Connected Successfully!"))
    .catch(err => console.error("❌ Database Connection Error:", err));

// 2. API: SYNC PRICE (Extension sends data here)
app.post('/api/sync', async (req, res) => {
    try {
        const { url, title, price, image } = req.body;

        if (!url || !price) {
            return res.status(400).json({ error: "Missing url or price" });
        }

        // A. Update or Create the Product
        const product = await Product.findOneAndUpdate(
            { u: url }, // Use the actual field name, not the alias
            { 
                u: url,
                t: title, 
                i: image, 
                d: new Date() 
            },
            { upsert: true, new: true } // Create if doesn't exist
        );

        // B. Add to History
        const newHistory = new History({ pid: url, p: price });
        await newHistory.save();

        console.log(`💾 Saved: ৳${price} for ${title.substring(0, 15)}...`);
        res.json({ success: true, message: "Price saved to Cloud DB" });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. API: GET HISTORY (For the graph)
app.get('/api/history', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url parameter" });

    try {
        // Get the last 100 price points for this URL (using actual field name 'pid')
        const history = await History.find({ pid: url })
            .sort({ d: 1 }) // Oldest first (for graph) - using actual field 'd'
            .limit(100);
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));