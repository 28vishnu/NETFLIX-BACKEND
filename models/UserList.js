// movie-streamer-backend/models/UserList.js
const mongoose = require('mongoose');

// Schema for individual items within a user's list
const UserListItemSchema = new mongoose.Schema({
    imdbID: { type: String, sparse: true }, // Unique IMDb ID of the movie/series (can be null if only tmdbId available)
    tmdbId: { type: Number, sparse: true }, // Unique TMDB ID (can be null if only imdbId available)
    title: { type: String, required: true },
    poster: { type: String }, // Relative path to the poster image from TMDB
    type: { type: String, enum: ['movie', 'series'], required: true }, // 'movie' or 'series'
    year: { type: String } // Year of release
});

// Main schema for a user's list
const UserListSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Unique identifier for the user (from frontend localStorage)
    items: [UserListItemSchema] // Array of items in this user's list
}, { timestamps: true }); // Mongoose will automatically add createdAt and updatedAt fields

module.exports = mongoose.model('UserList', UserListSchema);
