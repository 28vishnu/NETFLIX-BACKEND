// Filename: movie-streamer-backend/models/Series.js

const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imdbID: { type: String, unique: true, sparse: true }, // Changed: Removed 'required: true', added 'sparse: true'
    tmdbId: { type: Number, unique: true, sparse: true }, // Added tmdbId and made it unique & sparse
    year: { type: String }, // First air date year
    plot: { type: String },
    poster: { type: String },
    backdrop: { type: String },
    genre: { type: [String] },
    imdbRating: { type: String },
    totalSeasons: { type: String }, // Number of seasons
    numberOfEpisodes: { type: String }, // Total number of episodes
    director: { type: String }, // Often 'N/A' for series, but keeping for consistency
    writer: { type: String },
    actors: { type: String },
    type: { type: String, default: 'series' }, // 'series'
    telegramPlayableUrl: { type: String, default: null },
    seasons: [ // Embedded schema for season details (not exhaustive, fetched on demand)
        {
            id: Number,
            season_number: Number,
            name: String,
            overview: String,
            air_date: String,
            episode_count: Number,
            poster_path: String,
        }
    ]
    // You can add more fields if needed based on TMDB data
}, { timestamps: true });

const Series = mongoose.model('Series', seriesSchema);

module.exports = Series;
