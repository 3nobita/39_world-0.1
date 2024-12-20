//allRoutes/notesRouters.ejs

const express = require('express');
const router = express.Router();
const Notes = require('../models/Notes'); // Import the Notes model

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
};


// Route to render the form page (addnotes.ejs)
router.get('/addnotes', (req, res) => {
    res.render('post/addnotes'); // Renders views/post/addnotes.ejs
});

// Route to handle form submission and save data to MongoDB
router.post('/api/notes', isAuthenticated, async (req, res) => {
    const { heading, points, explain } = req.body;

    if (!heading || !points || !explain || points.length === 0) {
        return res.status(400).json({ success: false, message: "Heading, points, and explain are required" });
    }

    try {
        const newNote = new Notes({
            heading,
            points,
            explain,
            user: req.session.user._id // Associate the note with the logged-in user
        });

        await newNote.save();
        res.status(201).json({ success: true, message: "Note created successfully!" });
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ success: false, message: "Error saving note", error: err });
    }
});



// Route to display all notes on notes.ejs
router.get('/notes', isAuthenticated, async (req, res) => {
    try {
        const notes = await Notes.find({ user: req.session.user._id }); // Fetch notes specific to the user
        res.render('notes', { notes });
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle search functionality
router.get('/suggest', async (req, res) => {
    const searchQuery = req.query.query; // Get user input from query params
    try {
        const suggestions = await Notes.find({
            $or: [
                { heading: { $regex: searchQuery, $options: 'i' } },
                { points: { $regex: searchQuery, $options: 'i' } },
                { explain: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('heading').limit(5); // Limit to 5 suggestions for performance

        // Extract only the headings from results
        const suggestionList = suggestions.map(note => note.heading);
        res.json(suggestionList); // Return suggestions as JSON
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to handle search queries
router.get('/search', async (req, res) => {
    const query = req.query.query;

    try {
        if (!query) {
            return res.status(400).send('Query parameter is required');
        }

        // Search the notes collection for matching headings, points, or explains
        const notes = await Notes.find({
            $or: [
                { heading: { $regex: query, $options: 'i' } }, // Case-insensitive search
                { points: { $in: [new RegExp(query, 'i')] } },  // Search within points array
                { explain: { $in: [new RegExp(query, 'i')] } }  // Search within explain array
            ]
        });

        // Render the search results
        res.render('searchNotes', { notes }); // You can change 'searchNotes' to your desired view
    } catch (err) {
        console.error('Error searching notes:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the edit form with the note's current data
router.get('/editnotes/:id', async (req, res) => {
    try {
        const userId = req.session?.user?._id; // Assuming the session stores the logged-in user's `_id`
        if (!userId) {
            return res.status(401).send('Unauthorized. Please log in.');
        }

        // Find the note by ID and ensure it belongs to the logged-in user
        const note = await Notes.findOne({ _id: req.params.id, user: userId });
        if (!note) {
            return res.status(404).send('Note not found or you do not have permission to edit it.');
        }

        res.render('edit/editnotes', { note }); // Render edit form with the note data
    } catch (err) {
        console.error('Error fetching note:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the updating of a note
router.post('/editnotes/:id', async (req, res) => {
    const { heading, points, explain } = req.body;

    // Ensure points is an array
    const pointsArray = Array.isArray(points) ? points : points ? points.split(',').map(point => point.trim()) : [];

    // Ensure explain is an array
    const explainArray = Array.isArray(explain) ? explain : explain ? explain.split(',').map(exp => exp.trim()) : [];

    try {
        const userId = req.session?.user?._id; // Assuming the session stores the logged-in user's `_id`
        if (!userId) {
            return res.status(401).send('Unauthorized. Please log in.');
        }

        // Find the note by ID and ensure it belongs to the logged-in user
        const note = await Notes.findOne({ _id: req.params.id, user: userId });
        if (!note) {
            return res.status(404).send('Note not found or you do not have permission to edit it.');
        }

        // Update the note's fields
        note.heading = heading;
        note.points = pointsArray;
        note.explain = explainArray;

        await note.save();
        res.redirect('/notes'); // Redirect to the notes list after saving the changes
    } catch (err) {
        console.error('Error updating note:', err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/delete/:id', isAuthenticated, async (req, res) => {
    const noteID = req.params.id;
    try {
        const note = await Notes.findOneAndDelete({ _id: noteID, user: req.session.user._id });
        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized." });
        }
        res.redirect('/notes');
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).render('error', { error: err });
    }
});




module.exports = router;
