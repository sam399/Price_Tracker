// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Product, History } = require('./model');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your extension to talk to this server

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
            { url: url }, 
            { 
                url, 
                title, 
                image, 
                lastUpdated: new Date() 
            },
            { upsert: true, new: true } // Create if doesn't exist
        );

        // B. Add to History
        // (Optional: You can check if the price is different from the last entry before saving to save space)
        const newHistory = new History({ productUrl: url, price: price });
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
        // Get the last 30 price points for this URL
        const history = await History.find({ productUrl: url })
            .sort({ date: 1 }) // Oldest first (for graph)
            .limit(100);
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));