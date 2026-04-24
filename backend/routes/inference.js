const express = require('express');
const router = express.Router();
const inferenceController = require('../controllers/inferenceController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/upload', auth, upload.single('image'), inferenceController.uploadSonogram);
router.get('/history', auth, inferenceController.getSonograms);
router.delete('/:id', auth, inferenceController.deleteSonogram);

module.exports = router;
