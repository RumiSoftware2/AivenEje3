const express = require('express');
const controller = require('../controllers/backup.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.post('/', requireAuth, requireRole('admin'), controller.descargar);
router.get('/restauraciones', requireAuth, requireRole('admin'), controller.listarRestauraciones);
router.get('/restauraciones/:id/pagos', requireAuth, requireRole('admin'), controller.verPagosRestaurados);

module.exports = router;
