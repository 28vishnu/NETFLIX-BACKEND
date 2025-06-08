const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests to TMDB

// Load environment variables from .env file (if running locally)
// In production environments like Render, these are automatically provided.
require('dotenv').config(); 

const Movie = require('./models/Movie'); // Your Movie model
const Series = require('./models/Series'); // Your Series model
const UserList = require('./models/UserList'); // Your UserList model

const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 for the backend, or environment variable

// TMDB API Configuration - IMPORTANT: Now reads from environment variable
// Replace 'YOUR_TMDB_API_KEY' with your actual TMDB API Key (v4 API key, starting with eyJ... or v3 API key)
// This variable MUST be set in your Render environment variables.
const TMDB_API_KEY = process.env.TMDB_API_KEY; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.themoviedb.org/t/p/'; // Use w500 for posters, original for backdrops

// Add a check to ensure the TMDB_API_KEY is loaded
if (!TMDB_API_KEY) {
    console.error('Error: TMDB_API_KEY is not set in your environment variables.');
    // In a production environment, you might want to exit or handle this more gracefully.
    // For local development, ensure it's in your .env file.
}

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING'; // Your MongoDB URI
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'NETFLIX' // Specify your database name here
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON requests

// --- API Routes ---

// Root endpoint
app.get('/', (req, res) => {
    res.send('Netflix Clone Backend is running!');
});

// --- Trending/Popular/Best Content (MUST BE DEFINED BEFORE GENERIC :id ROUTES) ---

// Get trending movies (using TMDB API for dynamic content)
app.get('/api/movies/trending', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
        
        const trendingMovies = response.data.results.map(item => ({
            tmdbId: item.id,
            title: item.title,
            plot: item.overview,
            poster: item.poster_path,
            backdrop: item.backdrop_path,
            release_date: item.release_date,
            year: item.release_date ? new Date(item.release_date).getFullYear().toString() : 'N/A',
            imdbRating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            type: 'movie',
        }));
        res.json(trendingMovies);
    } catch (error) {
        console.error('Error fetching trending movies from TMDB:', error.message);
        res.status(500).json({ message: 'Failed to fetch trending movies from external API.' });
    }
});

// Get popular movies from your DB
app.get('/api/movies/popular', async (req, res) => {
    try {
        const movies = await Movie.find({}).sort({ imdbVotes: -1 }).limit(20);
        res.json(movies);
    } catch (error) {
        console.error('Error fetching popular movies from DB:', error);
        res.status(500).json({ message: 'Error fetching popular movies.' });
    }
});

// Get best series from your DB (e.g., by highest rating)
app.get('/api/series/best', async (req, res) => {
    try {
        const series = await Series.find({}).sort({ imdbRating: -1 }).limit(20);
        res.json(series);
    } catch (error) {
        console.error('Error fetching best series from DB:', error);
        res.status(500).json({ message: 'Error fetching best series.' });
    }
});


// --- Content Fetching Routes (Movies & Series - More Generic) ---

// Get all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.json(movies);
    } catch (error) {
        console.error('Error fetching all movies:', error);
        res.status(500).json({ message: 'Error fetching movies.' });
    }
});

// Get all series
app.get('/api/series', async (req, res) => {
    try {
        const series = await Series.find({});
        res.json(series);
    } catch (error) {
        console.error('Error fetching all series:', error);
        res.status(500).json({ message: 'Error fetching series.' });
    }
});

// Get a single movie by IMDb ID or TMDB ID (this must come AFTER specific routes like /movies/popular)
app.get('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let movie = await Movie.findOne({ imdbID: id });
        if (!movie) {
            // If not found by IMDb ID, try by TMDB ID
            // Only attempt number conversion if 'id' looks like a number
            if (!isNaN(id) && !isNaN(parseFloat(id))) {
                movie = await Movie.findOne({ tmdbId: id });
            }
        }
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found.' });
        }
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ message: 'Error fetching movie details.' });
    }
});

// Get a single series by IMDb ID or TMDB ID (this must come AFTER specific routes like /series/best)
app.get('/api/series/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let series = await Series.findOne({ imdbID: id });
        if (!series) {
            // If not found by IMDb ID, try by TMDB ID
            // Only attempt number conversion if 'id' looks like a number
            if (!isNaN(id) && !isNaN(parseFloat(id))) {
                series = await Series.findOne({ tmdbId: id });
            }
        }
        if (!series) {
            return res.status(404).json({ message: 'Series not found.' });
        }
        res.json(series);
    } catch (error) {
        console.error('Error fetching series details:', error);
        res.status(500).json({ message: 'Error fetching series details.' });
    }
});


// --- Genre-specific Content ---

// Get movies by genre
app.get('/api/movie/genre/:genreName', async (req, res) => {
    try {
        const genreName = req.params.genreName;
        // Case-insensitive search for genre in the 'genre' array field
        const movies = await Movie.find({
            genre: { $regex: new RegExp(genreName, 'i') }
        }).limit(50); // Limit results for rows
        res.json(movies);
    } catch (error) {
        console.error(`Error fetching movies by genre "${req.params.genreName}":`, error);
        res.status(500).json({ message: 'Error fetching movies by genre.' });
    }
});

// Get series by genre
app.get('/api/series/genre/:genreName', async (req, res) => {
    try {
        const genreName = req.params.genreName;
        // Case-insensitive search for genre in the 'genre' array field
        const series = await Series.find({
            genre: { $regex: new RegExp(genreName, 'i') }
        }).limit(50); // Limit results for rows
        res.json(series);
    } catch (error) {
        console.error(`Error fetching series by genre "${req.params.genreName}":`, error);
        res.status(500).json({ message: 'Error fetching series by genre.' });
    }
});

// Get all unique movie genres from the database
app.get('/api/genres/movies', async (req, res) => {
    try {
        const genres = await Movie.distinct('genre');
        // Filter out any null, empty strings, or non-string values from the array
        const cleanGenres = genres.flat().filter(g => typeof g === 'string' && g.trim() !== '');
        // Remove duplicates and sort
        const uniqueSortedGenres = [...new Set(cleanGenres)].sort();
        res.json({ genres: uniqueSortedGenres });
    } catch (error) {
        console.error('Error fetching movie genres:', error);
        res.status(500).json({ message: 'Error fetching movie genres.' });
    }
});

// Get all unique series genres from the database
app.get('/api/genres/series', async (req, res) => {
    try {
        const genres = await Series.distinct('genre');
        // Filter out any null, empty strings, or non-string values from the array
        const cleanGenres = genres.flat().filter(g => typeof g === 'string' && g.trim() !== '');
        // Remove duplicates and sort
        const uniqueSortedGenres = [...new Set(cleanGenres)].sort();
        res.json({ genres: uniqueSortedGenres });
    } catch (error) {
        console.error('Error fetching series genres:', error);
        res.status(500).json({ message: 'Error fetching series genres.' });
    }
});


// --- User List (My List) Endpoints ---

// Get user's list
app.get('/api/mylist/:userId', async (req, res) => {
    try {
        const userList = await UserList.findOne({ userId: req.params.userId });
        if (!userList) {
            // If user list doesn't exist, return an empty list
            return res.json({ userId: req.params.userId, items: [] });
        }
        res.json(userList);
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ message: 'Error fetching user list.' });
    }
});

// Add item to user's list
app.post('/api/mylist/add', async (req, res) => {
    const { userId, item } = req.body;
    if (!userId || !item || (!item.imdbID && !item.tmdbId)) {
        return res.status(400).json({ message: 'User ID and item with IMDb/TMDB ID are required.' });
    }

    try {
        let userList = await UserList.findOne({ userId });
        if (!userList) {
            userList = new UserList({ userId, items: [] });
        }

        // Check for duplicates before adding
        const isDuplicate = userList.items.some(existingItem => 
            (item.imdbID && existingItem.imdbID === item.imdbID) ||
            (item.tmdbId && existingItem.tmdbId === item.tmdbId)
        );

        if (isDuplicate) {
            return res.status(409).json({ message: 'Item already in list!' });
        }

        userList.items.push(item);
        await userList.save();
        res.status(201).json({ message: 'Item added to list successfully!', userList });
    } catch (error) {
        console.error('Error adding item to list:', error);
        res.status(500).json({ message: 'Error adding item to list.' });
    }
});

// Remove item from user's list
app.post('/api/mylist/remove', async (req, res) => {
    const { userId, imdbID, tmdbId } = req.body;
    // Require at least one ID for removal
    if (!userId || (!imdbID && !tmdbId)) {
        return res.status(400).json({ message: 'User ID and either IMDb ID or TMDB ID are required.' });
    }

    try {
        const userList = await UserList.findOne({ userId });
        if (!userList) {
            return res.status(404).json({ message: 'User list not found.' });
        }

        const initialLength = userList.items.length;
        userList.items = userList.items.filter(item => {
            // Filter by imdbID if provided, else by tmdbId
            // Ensure strict equality and consideration for both IDs
            if (imdbID && item.imdbID === imdbID) return false;
            if (tmdbId && item.tmdbId === tmdbId) return false;
            return true;
        });

        if (userList.items.length < initialLength) {
            await userList.save();
            res.json({ message: 'Item removed from list successfully!', userList });
        } else {
            res.status(404).json({ message: 'Item not found in your list.' });
        }
    } catch (error) {
        console.error('Error removing item from list:', error);
        res.status(500).json({ message: 'Error removing item from list.' });
    }
});

// --- Search Endpoint ---
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
        // Case-insensitive search across title, plot, and genres for both movies and series
        const searchRegex = new RegExp(query, 'i');

        const movies = await Movie.find({
            $or: [
                { title: searchRegex },
                { plot: searchRegex },
                { genre: searchRegex },
                { actors: searchRegex },
                { director: searchRegex }
            ]
        }).limit(50); // Limit search results

        const series = await Series.find({
            $or: [
                { name: searchRegex },
                { plot: searchRegex },
                { genre: searchRegex },
                { actors: searchRegex },
                { director: searchRegex }
            ]
        }).limit(50); // Limit search results

        res.json({ movies, series });

    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ message: 'Error performing search.' });
    }
});

// --- TMDB Integration for Series Seasons/Episodes (if you need real-time TMDB data) ---

// Get seasons for a TMDB series ID
app.get('/api/series/:tmdbId/seasons', async (req, res) => {
    const { tmdbId } = req.params;
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
        // Return only the seasons array from the TV show details
        res.json(response.data.seasons);
    } catch (error) {
        console.error(`Error fetching seasons for TMDB series ${tmdbId}:`, error.message);
        res.status(500).json({ message: 'Failed to fetch seasons.' });
    }
});

// Get episodes for a specific season of a TMDB series
app.get('/api/series/:tmdbId/season/:seasonNumber/episodes', async (req, res) => {
    const { tmdbId, seasonNumber } = req.params;
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
        // Return only the episodes array from the season details
        res.json(response.data.episodes);
    } catch (error) {
        console.error(`Error fetching episodes for TMDB series ${tmdbId}, season ${seasonNumber}:`, error.message);
        res.status(500).json({ message: 'Failed to fetch episodes.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
