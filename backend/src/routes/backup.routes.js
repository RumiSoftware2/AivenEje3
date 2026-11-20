const express = require('express');
const controller = require('../controllers/backup.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.post('/', requireAuth, requireRole('admin'), controller.descargar);

module.exports = router;
