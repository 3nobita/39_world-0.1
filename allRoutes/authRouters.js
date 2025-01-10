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

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // App-Specific Password
    }
});
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.status(401).json({ success: false, massage: "Unauthorized. Please log in." }) // Redirect to the login page if not authenticated
    }
}

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
    const { identifier, password } = req.body;

    try {
        // Find the user by either email or displayName
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { displayName: identifier }
            ]
        });

        if (!user) {
            return res.status(401).render('login', { error: 'Invalid email/username or password.' });
        }

        // Check if the password matches
        const isPasswordValid = (password, user.password);
        if (!isPasswordValid) {
            return res.status(401).render('login', { error: 'Invalid email/username or password.' });
        }

        // Save the user session
        req.session.user = user;

        // Redirect to the home page
        res.redirect('/home');
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).render('login', { error: 'Something went wrong. Please try again.' });
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

router.post('/profile/username', async (req, res) => {
    const { username } = req.body;
    const userId = req.session.user._id;

    try {
        const user = await User.findById(userId);
        user.displayName = username;
        await user.save();

        // Update session user data
        req.session.user.displayName = username;

        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Update password
router.post('/profile/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user._id;

    try {
        const user = await User.findById(userId);

        // Check if current password matches
        if (user.password !== currentPassword) {
            return res.status(400).send('Current password is incorrect.');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/update-birthdate', async (req, res) => {
    const { birthDate } = req.body;

    try {
        // Validate session
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // Update the user's birth date
        await User.findByIdAndUpdate(req.session.user._id, { birthDate });

        // Update session data
        req.session.user.birthDate = birthDate;

        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating birth date:', err);
        res.status(500).send('Something went wrong. Please try again.');
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
