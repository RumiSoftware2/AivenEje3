const express = require('express');
const controller = require('../controllers/pagos.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.get('/', requireRole('admin', 'consulta'), controller.listar);
router.get('/:id', requireRole('admin', 'consulta'), controller.obtener);
router.post('/', requireRole('admin', 'registro'), controller.crear);
router.put('/:id', requireRole('admin'), controller.actualizar);
router.delete('/:id', requireRole('admin'), controller.eliminar);

module.exports = router;
