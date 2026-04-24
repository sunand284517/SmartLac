const mongoose = require('mongoose');

const SonogramResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cowId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  classification: { type: String, default: null }, // e.g., 'Peak Lactation', 'Dry Period'
  confidence: { type: Number, default: null },
  predictedYield: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SonogramResult', SonogramResultSchema);
