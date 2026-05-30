const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inference', require('./routes/inference'));

// Database connection
const connectWithRetry = () => {
    mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy-sonogram')
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error(`❌ MongoDB connection failed: ${err.message}. Retrying in 5 seconds...`);
        setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Basic route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dairy Sonogram API is running' });
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'dairy-sonogram-backend' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
