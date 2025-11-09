const express = require('express');
const router = express.Router();
const {
  createRide,
  getAllRides,
  searchRides,
  getRideById,
  getMyPostedRides,
  updateRide,
  cancelRide,
  deleteRide
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRide);
router.get('/', getAllRides);
router.get('/search', searchRides);
router.get('/my-rides', protect, getMyPostedRides);
router.get('/:id', getRideById);
router.put('/:id', protect, updateRide);
router.put('/:id/cancel', protect, cancelRide);
router.delete('/:id', protect, deleteRide);

module.exports = router;