const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(err => console.log("DB Connection Error: ", err));

// Schema & Model
const requestSchema = new mongoose.Schema({
    requestId: String,
    date: String,
    name: String,
    phone: String,
    service: String,
    address: String,
    feeNum: Number,
    status: { type: String, default: "Pending" }
});

const RequestModel = mongoose.model('Request', requestSchema);

// 1. Submit Application (POST)
app.post('/api/requests', async (req, res) => {
    try {
        const count = await RequestModel.countDocuments();
        const newId = "REQ" + (1001 + count);
        
        const newReq = new RequestModel({
            requestId: newId,
            date: new Date().toISOString().split('T')[0],
            name: req.body.name,
            phone: req.body.phone,
            service: req.body.service,
            address: req.body.address,
            feeNum: req.body.feeNum,
            status: "Pending"
        });

        await newReq.save();
        res.json({ success: true, requestId: newId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get All Requests for Admin (GET)
app.get('/api/requests', async (req, res) => {
    try {
        const requests = await RequestModel.find().sort({ _id: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Track Application Status by ID (GET)
app.get('/api/requests/:id', async (req, res) => {
    try {
        const reqId = req.params.id;
        const found = await RequestModel.findOne({ requestId: reqId });
        if (found) {
            res.json({ success: true, request: found });
        } else {
            res.json({ success: false, message: "Request not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Admin Login Authentication Route (POST)
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPass) {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.json({ success: false, error: "தவறான பாஸ்வேர்ட் (Invalid Password)" });
    }
});

// ==========================================
// Frontend Static Files & Safe Fallback
// ==========================================
app.use(express.static(path.join(__dirname)));

// Safe fallback middleware for all other requests
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
