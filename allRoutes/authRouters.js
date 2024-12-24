const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Your User model
const crypto = require('crypto');
const session = require('express-session');

// Add this middleware before your routes
router.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `secure: true` if using HTTPS
}));

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
};


// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // App-Specific Password
    }
});

// Function to Generate Random Password
const generateRandomPassword = () => {
    try {
        return crypto.randomBytes(6).toString('hex'); // Generates a 12-character random password
    } catch (error) {
        console.log('Error using crypto.randomBytes. Falling back to Math.random.');
        // Fallback random password generator if crypto is unavailable
        return Math.random().toString(36).slice(-8); // Generates a random 8-character password
    }
};

// Send Email with Random Password
const sendEmailWithPassword = async (email, password) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome! Here is Your Password',
            text: `Thank you for signing up!\n\nYour auto-generated password is: ${password}\nPlease use this password to log in.`
        });
        console.log('Password email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email.');
    }
};

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // Generate Random Password
        const randomPassword = generateRandomPassword();

        // Save User to Database (Storing password in plain text)
        const newUser = new User({
            email,
            password: randomPassword // Store plaintext password (not recommended for production)
        });
        await newUser.save();

        // Send Email with Random Password
        await sendEmailWithPassword(email, randomPassword);

        res.status(200).json({ message: 'Account created! Password sent to your email.' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || password !== user.password) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        // Set session user
        req.session.user = { _id: user._id, email: user.email };
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the user exists in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        // Generate a new random password
        const newPassword = Math.random().toString(36).slice(-8);

        // Save the new password in the database
        user.password = newPassword; // Directly saving plain text password
        await user.save();

        // Send the new password to the user's email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `Hello,\n\nYour password has been reset. Your new password is: ${newPassword}\n\nPlease use this password to log in and change it as soon as possible.`,
        });

        res.status(200).json({ message: 'A new password has been sent to your email.' });
    } catch (error) {
        console.error('Forgot Password error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out. Please try again.');
        }
        res.redirect('/login'); // Redirect to login or home page
    });
});


module.exports = router;
