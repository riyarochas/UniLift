const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { rideId, seatsBooked, pickupPoint } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({ message: 'Ride is not active' });
    }

    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    if (ride.driver.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot book your own ride' });
    }

    const existingBooking = await Booking.findOne({
      ride: rideId,
      rider: req.user._id,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this ride' });
    }

    const booking = await Booking.create({
      ride: rideId,
      rider: req.user._id,
      seatsBooked,
      pickupPoint,
      status: 'confirmed'
    });

    ride.availableSeats -= seatsBooked;
    await ride.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('ride')
      .populate('rider', 'name phone email college');

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for logged-in user (as rider)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user._id })
      .populate({
        path: 'ride',
        populate: { path: 'driver', select: 'name phone rating college email' }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all booking requests for rides posted by logged-in user (as driver)
exports.getBookingsForMyRides = async (req, res) => {
  try {
    const myRides = await Ride.find({ driver: req.user._id }).select('_id');
    const rideIds = myRides.map(ride => ride._id);

    const bookings = await Booking.find({ ride: { $in: rideIds } })
      .populate('ride')
      .populate('rider', 'name phone email college rating')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'ride',
        populate: { path: 'driver', select: 'name phone rating college email' }
      })
      .populate('rider', 'name phone email college rating');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.rider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const ride = await Ride.findById(booking.ride);
    ride.availableSeats += booking.seatsBooked;
    await ride.save();

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate and review after ride
exports.rateBooking = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.rider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.rating = rating;
    booking.feedback = feedback;
    booking.status = 'completed';
    await booking.save();

    const ride = await Ride.findById(booking.ride);
    const driver = await User.findById(ride.driver);
    
    const newTotalRatings = driver.totalRatings + 1;
    const newRating = ((driver.rating * driver.totalRatings) + rating) / newTotalRatings;
    
    driver.rating = newRating;
    driver.totalRatings = newTotalRatings;
    await driver.save();

    res.json({ message: 'Rating submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};