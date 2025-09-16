const express = require('express');

const router = express.Router();

// GET /hello
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

// GET /
router.get('/', (req, res) => {
  res.type('text').send('Express server running. Try GET /hello');
});

module.exports = router;


