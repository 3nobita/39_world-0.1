const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// Add this middleware before your routes
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `secure: true` if using HTTPS
}));

// Middleware 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.status(401).json({ success: false, massage: "Unauthorized. Please log in." }) // Redirect to the login page if not authenticated
    }
}


// Import the notesRouters
const notesRouters = require('./allRoutes/notesRouters');
const authRouters = require('./allRoutes/authRouters');

// Use the routes 
app.use(notesRouters);
app.use(authRouters);

// allgets
app.get('/signup', (req, res) => {
    res.render('signup')
})
app.get('/', (req, res) => {
    if (req.session.user) {
        // If the user is already logged in, redirect them to the home page or dashboard
        res.redirect('/home');
    } else {
        // If no session exists, redirect to the login page
        res.redirect('/login');
    }
});
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/home'); // Redirect only if authenticated
    }
    res.render('login');
});
app.get('/home', isAuthenticated, (req, res) => {
    res.render('home', { User: req.session.user });
});
app.get('/forgot-password', (req, res) => {
    res.status(200).json({ message: 'Forgot Password API is working. Use POST /forgot-password to reset your password.' });
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login'); // Clear session and redirect to login
    });
});

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
