// allRoutes/notesRouters.js (with MongoDB data fetch)

const express = require('express');
const router = express.Router();
const Notes = require('../models/Notes');  // Correct way to import the Notes model

// Route for rendering the 'note' page and passing data to the view
router.get('/note', async (req, res) => {
    try {
        // Fetch all notes from MongoDB
        const notes = await Notes.find(); // or any other query you want to apply

        // Render the 'note' page and pass the fetched notes data
        res.render('note', { notes });  // Pass notes data to the view
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;  // Export the router
