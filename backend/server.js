const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inference', require('./routes/inference'));

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy-sonogram')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(`❌ MongoDB connection failed: ${err.message}`));

// Basic route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dairy Sonogram API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
