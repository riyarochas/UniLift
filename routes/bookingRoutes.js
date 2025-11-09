const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingsForMyRides,
  getBookingById,
  cancelBooking,
  rateBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/my-rides-bookings', protect, getBookingsForMyRides);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/rate', protect, rateBooking);

module.exports = router;