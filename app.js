const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
// Import the notesRouters
const notesRouters = require('./allRoutes/notesRouters');

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true })); // For form data (application/x-www-form-urlencoded)
app.use(express.json()); // For JSON data

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB is connected!');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// Use the routes defined in notesRouters
app.use(notesRouters);

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
