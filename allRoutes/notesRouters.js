const express = require('express');
const router = express.Router();
const Notes = require('../models/Notes'); // Import the Notes model

// Route to render the form page (addnotes.ejs)
router.get('/addnotes', (req, res) => {
    res.render('post/addnotes'); // Renders views/post/addnotes.ejs
});

// Route to handle form submission and save data to MongoDB
router.post('/api/notes', (req, res) => {
    const { heading, points, explain } = req.body;

    if (!heading || !points || !explain || points.length === 0) {
        return res.status(400).json({ success: false, message: "Heading, points, and explain are required" });
    }

    const newNote = new Notes({
        heading,
        points,
        explain
    });

    newNote.save()
        .then(() => res.status(201).json({ success: true, message: "Note posted successfully!" }))
        .catch(err => res.status(500).json({ success: false, message: "Error saving note", error: err }));
});


// Route to display all notes on notes.ejs
router.get('/notes', async (req, res) => {
    try {
        // Fetch all notes from MongoDB
        const notes = await Notes.find();

        // Render notes.ejs and pass the fetched data
        res.render('notes', { notes }); // Renders views/notes.ejs
    } catch (err) {
        console.error("Error fetching notes:", err);
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
        const note = await Notes.findById(req.params.id); // Find note by ID
        if (!note) {
            return res.status(404).send('Note not found');
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

    // Ensure points is a string if it isn't one already
    const pointsArray = Array.isArray(points) ? points : points ? points.split(',').map(point => point.trim()) : [];

    // Similarly, ensure explain is an array if it's not one already
    const explainArray = Array.isArray(explain) ? explain : explain ? explain.split(',').map(exp => exp.trim()) : [];

    try {
        const note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).send('Note not found');
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
router.post('/delete/:id',async(req,res)=>{
    const noteID = req.params.id;
    try{
        await Notes.findByIdAndDelete(noteID);
        res.redirect('/notes')
    }
    catch(err){
        res.render('solve this error',err);
        res.status(500).send('internal Problem')
    }
  
})




module.exports = router;
