// Filename: movie-streamer-backend/models/Movie.js

const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imdbID: { type: String, unique: true, sparse: true }, // Changed: Removed 'required: true', added 'sparse: true'
    tmdbId: { type: Number, unique: true, sparse: true }, // Added tmdbId and made it unique & sparse
    year: { type: String },
    plot: { type: String },
    poster: { type: String }, // URL to poster image
    backdrop: { type: String }, // URL to backdrop image
    genre: { type: [String] }, // Array of genre names
    imdbRating: { type: String },
    runtime: { type: String },
    director: { type: String },
    writer: { type: String },
    actors: { type: String },
    type: { type: String, default: 'movie' }, // 'movie'
    telegramPlayableUrl: { type: String, default: null }, // URL to the Telegram playable link
    // You can add more fields if needed based on TMDB data
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
