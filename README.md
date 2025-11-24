# ✨ UniLift — Smart Campus Carpool App

UniLift is a campus-focused carpool platform designed to help students save money, reduce traffic, and travel safely together. It connects riders and drivers within the university ecosystem using real-time route matching, verified profiles, and an easy-to-use interface.

## 🚀 Features

🎯 Core Functionalities

- Post a Ride – Drivers can share their route, timing, and available seats.

- Find a Ride – Students can search for carpools between any two locations.

- Real-Time Route Matching – Matches rides using a custom algorithm that considers:

Pickup proximity

Drop proximity

Date/time relevance

Gaussian scoring for smooth ranking

- Booking System – Riders can request seats and view their bookings.

- Driver Dashboard – Manage posted rides, seat availability, and ride status.




## 🛡 Safety & Reliability

- User authentication

- Email verification

- Profile ratings

- Driver details visible before booking



## 🛠 Tech Stack

### Frontend (Mobile App)

- React Native (Expo)

- Expo Router

- OpenStreetMap

- Context API for authentication

- Axios for API communication

### Backend (API Server)

- Node.js + Express.js

- MongoDB (Mongoose)

- JWT Authentication

- Secure route handling

- Ride and booking controllers



## 🧠 Route Matching Algorithm (Short Overview)

UniLift uses a three-factor scoring system:

Pickup Distance Score

Drop Distance Score

Time Relevance Score


Then applies a Gaussian curve to smooth scoring based on geographical distance.

Final score =
0.45 * pickupScore + 0.45 * dropScore + 0.1 * timingScore

This ensures the best rides show up first, similar to professional carpool apps.

## 📷 App Highlights

### 🔹 Home Screen
<img src="assets/readme/login.jpeg" width="300"/>
<img src="assets/readme/verification.jpeg" width="300"/>


### 🔹 Ride Matching Screen
<img src="assets/readme/search ride.jpeg" width="300"/>

### 🔹 Post a Ride Screen
<img src="assets/readme/post ride.jpeg" width="300"/>

### 🔹 Track Driver/Rider Screen
<img src="assets/readme/track driver.jpeg" width="300"/>
<img src="assets/readme/track rider.jpeg" width="300"/>

### 🔹 Find Ride on Map Screen
<img src="assets/readme/map rides.jpeg" width="300"/>

### 🔹 Rating Page
<img src="assets/readme/rating.jpeg" width="300"/>

## 📘 Future Scope

- Push notifications

- AI-powered route suggestions

- Wallet + payments inside the app