const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'UniLift API is running!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me'
      },
      rides: {
        create: 'POST /api/rides',
        getAll: 'GET /api/rides',
        search: 'GET /api/rides/search',
        getMyRides: 'GET /api/rides/my-rides',
        getById: 'GET /api/rides/:id',
        update: 'PUT /api/rides/:id',
        cancel: 'PUT /api/rides/:id/cancel',
        delete: 'DELETE /api/rides/:id'
      },
      bookings: {
        create: 'POST /api/bookings',
        getMyBookings: 'GET /api/bookings/my-bookings',
        getBookingsForMyRides: 'GET /api/bookings/my-rides-bookings',
        getById: 'GET /api/bookings/:id',
        cancel: 'PUT /api/bookings/:id/cancel',
        rate: 'PUT /api/bookings/:id/rate'
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
