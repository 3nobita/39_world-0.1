const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// Middleware 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Import the notesRouters
const notesRouters = require('./allRoutes/notesRouters');
const authRouters = require('./allRoutes/authRouters');

// Use the routes 
app.use(notesRouters);
app.use(authRouters);

// allgets
app.get('/signup',(req,res)=>{
    res.render('signup')
})
app.get('/login',(req,res)=>{
    res.render('login')
})

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



// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
