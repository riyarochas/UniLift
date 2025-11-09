const Ride = require('../models/Ride');
const User = require('../models/User');

// Create a new ride
exports.createRide = async (req, res) => {
  try {
    const { source, destination, date, time, totalSeats, pricePerSeat, vehicleDetails, notes } = req.body;

    const ride = await Ride.create({
      driver: req.user._id,
      source,
      destination,
      date,
      time,
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      vehicleDetails,
      notes
    });

    const populatedRide = await Ride.findById(ride._id).populate('driver', 'name phone rating college');

    res.status(201).json(populatedRide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active rides
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'active' })
      .populate('driver', 'name phone rating college profilePicture')
      .sort({ date: 1, time: 1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search rides by source and destination
exports.searchRides = async (req, res) => {
  try {
    const { sourceAddress, destinationAddress, date } = req.query;

    let query = { status: 'active', availableSeats: { $gt: 0 } };

    if (sourceAddress) {
      query['source.address'] = { $regex: sourceAddress, $options: 'i' };
    }

    if (destinationAddress) {
      query['destination.address'] = { $regex: destinationAddress, $options: 'i' };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    const rides = await Ride.find(query)
      .populate('driver', 'name phone rating college profilePicture')
      .sort({ date: 1, time: 1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single ride by ID
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name phone rating college profilePicture email');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rides posted by the logged-in user (driver)
exports.getMyPostedRides = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id })
      .sort({ date: -1, createdAt: -1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ride
exports.updateRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if user is the driver
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ride' });
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('driver', 'name phone rating college');

    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this ride' });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.json({ message: 'Ride cancelled successfully', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete ride
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this ride' });
    }

    await ride.deleteOne();

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};