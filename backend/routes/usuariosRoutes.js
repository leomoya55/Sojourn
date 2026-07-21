const express = require('express');
const router = express.Router();
const { getAllUsuarios, getUsuarioById, updateUsuario, setActivoUsuario, deleteUsuario, changePassword } = require('../controllers/usuariosController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', restrictTo('administrador'), getAllUsuarios);
router.get('/:id', getUsuarioById);
router.put('/:id', updateUsuario);
router.patch('/:id/password', changePassword);
router.patch('/:id/estado', restrictTo('administrador'), setActivoUsuario);
router.delete('/:id', restrictTo('administrador'), deleteUsuario);

module.exports = router;
