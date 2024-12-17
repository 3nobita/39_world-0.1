const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Your User model
const crypto = require('crypto');

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

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find User by Email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        // Compare password directly (since it's stored in plain text)
        if (password !== user.password) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        // Redirect to home page after successful login
        res.redirect('/home'); // Redirecting to the '/home' route (you can change it based on your routing structure)
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
