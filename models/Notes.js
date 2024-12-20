// models/Notes.js
const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
    heading: { type: String, required: true },  // Heading is required
    points: { type: [String] } , // An array of strings if you want multiple points
    explain: { type: [String] },  // An array of strings if you want multiple points
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Reference to the User model
});

const Notes = mongoose.model('Notes', notesSchema);
module.exports = Notes;
