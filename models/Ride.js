const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    address: {
      type: String,
      required: [true, 'Please add source address']
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  destination: {
    address: {
      type: String,
      required: [true, 'Please add destination address']
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  date: {
    type: Date,
    required: [true, 'Please add ride date']
  },
  time: {
    type: String,
    required: [true, 'Please add ride time']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Please add total seats'],
    min: 1,
    max: 7
  },
  availableSeats: {
    type: Number,
    required: true
  },
  pricePerSeat: {
    type: Number,
    default: 0,
    min: 0
  },
  vehicleDetails: {
    model: String,
    number: String,
    color: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ride', rideSchema);