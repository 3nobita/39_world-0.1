// allRouter/mathRouters.js
const express = require('express');
const router = express.Router();
const { createQuestion } = require('../utils/questionGenerator');
const User = require('../models/User'); // Ensure you are importing your User model

// API to generate questions
router.get('/api/generate-question', (req, res) => {
    const difficulty = req.query.difficulty || 'easy';
    console.log(`Generating question for difficulty: ${difficulty}`);
    try {
        const question = createQuestion(difficulty);
        console.log("Generated question:", question);
        res.status(200).json({
            success: true,
            question
        });
    } catch (error) {
        console.error("Error generating question:", error);
        res.status(500).json({
            success: false,
            message: 'Error generating question',
            error: error.message
        });
    }
});

// API to submit math test results
router.post('/submit-math-test', async (req, res) => {
    const { difficulty, score } = req.body;

    try {
        // Check if user session exists
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        // Find the logged-in user
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Add math test result to user's mathScores
        user.mathScores.push({
            difficulty,
            score,
            date: new Date() // Ensure the current date is recorded
        });

        await user.save();

        // Redirect or send success response
        res.status(200).json({ success: true, message: 'Score saved successfully!' });
    } catch (err) {
        console.error("Error saving math test score:", err);
        res.status(500).json({ success: false, message: 'Error saving math test score' });
    }
});

router.post('/submit-math-test', async (req, res) => {
    const { difficulty, score } = req.body; // Expecting difficulty and score from the client
    try {
        // Find the user by ID from the session
        const user = await User.findById(req.session.user._id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Add the new score to the user's mathScores array
        user.mathScores.push({ difficulty, score });

        // Save the updated user document
        await user.save();

        console.log('Math score saved successfully:', user.mathScores);

        // Redirect to profile or send a success response
        res.redirect('/profile');
    } catch (err) {
        console.error('Error saving math test score:', err);
        res.status(500).send('Error saving math test score');
    }
});


module.exports = router;
