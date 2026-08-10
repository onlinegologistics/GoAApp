const express = require('express');
const router = express.Router();
const {
    getDirectoryStats,
    getUsersByRole,
    getOperatorsByType,
    updateDirectoryUserStatus,
    deleteDirectoryRecord,
    updateDirectoryRecord,
    toggleUserBlock
} = require('../controllers/userDirectoryController');

const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// All routes are protected and for Super Admin / Admin
router.use(authMiddleware);
router.use(checkRole(['superadmin', 'admin']));

router.get('/stats', getDirectoryStats);
router.get('/users', getUsersByRole);
router.get('/operators', getOperatorsByType);
router.put('/status/:id', updateDirectoryUserStatus);
router.delete('/delete/:id/:type', deleteDirectoryRecord);
router.put('/update/:id/:type', updateDirectoryRecord);
router.put('/block/:id', toggleUserBlock);

module.exports = router;
