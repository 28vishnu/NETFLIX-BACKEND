// Filename: movie-streamer-backend/importData.js

require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const axios = require('axios');
const Movie = require('./models/Movie'); // Your Movie model
const Series = require('./models/Series'); // Your Series model

// --- Configuration ---
const MONGO_URI = 'mongodb+srv://vishnusaketh07:NETFLIXCLONE@cluster0.yo7hthy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'NETFLIX'; // Your database name
const OMDB_API_KEY = process.env.OMDB_API_KEY; // Get API key from .env

if (!OMDB_API_KEY) {
    console.error('Error: OMDB_API_KEY is not set in your .env file.');
    process.exit(1);
}

// List of movies and series to import
// This list is significantly expanded. Be mindful of OMDb's rate limits (usually 1000 requests/day for free tier).
// If you hit limits, run it again tomorrow or after a few hours.
const titlesToImport = [
    // --- Popular Movies ---
    { title: 'The Shawshank Redemption', type: 'movie' },
    { title: 'The Godfather', type: 'movie' },
    { title: 'The Dark Knight', type: 'movie' },
    { title: 'The Godfather Part II', type: 'movie' },
    { title: '12 Angry Men', type: 'movie' },
    { title: 'Schindler\'s List', type: 'movie' },
    { title: 'The Lord of the Rings: The Return of the King', type: 'movie' },
    { title: 'Pulp Fiction', type: 'movie' },
    { title: 'The Lord of the Rings: The Fellowship of the Ring', type: 'movie' },
    { title: 'Forrest Gump', type: 'movie' },
    { title: 'Fight Club', type: 'movie' },
    { title: 'Inception', type: 'movie' },
    { title: 'The Lord of the Rings: The Two Towers', type: 'movie' },
    { title: 'Star Wars: Episode V - The Empire Strikes Back', type: 'movie' },
    { title: 'The Matrix', type: 'movie' },
    { title: 'Goodfellas', type: 'movie' },
    { title: 'One Flew Over the Cuckoo\'s Nest', type: 'movie' },
    { title: 'Seven Samurai', type: 'movie' },
    { title: 'Se7en', type: 'movie' },
    { title: 'City of God', type: 'movie' },
    { title: 'Interstellar', type: 'movie' },
    { title: 'The Silence of the Lambs', type: 'movie' },
    { title: 'Saving Private Ryan', type: 'movie' },
    { title: 'The Green Mile', type: 'movie' },
    { title: 'Spirited Away', type: 'movie' },
    { title: 'Parasite', type: 'movie' },
    { title: 'Whiplash', type: 'movie' },
    { title: 'The Intouchables', type: 'movie' },
    { title: 'The Prestige', type: 'movie' },
    { title: 'Gladiator', type: 'movie' },
    { title: 'Leon: The Professional', type: 'movie' },
    { title: 'The Departed', type: 'movie' },
    { title: 'The Usual Suspects', type: 'movie' },
    { title: 'American History X', type: 'movie' },
    { title: 'The Lion King', type: 'movie' },
    { title: 'Terminator 2: Judgment Day', type: 'movie' },
    { title: 'Back to the Future', type: 'movie' },
    { title: 'Psycho', type: 'movie' },
    { title: 'Modern Times', type: 'movie' },
    { title: 'The Pianist', type: 'movie' },
    { title: 'Dune: Part Two', type: 'movie' },
    { title: 'Godzilla Minus One', type: 'movie' },
    { title: 'Oppenheimer', type: 'movie' },
    { title: 'Barbie', type: 'movie' },
    { title: 'Killers of the Flower Moon', type: 'movie' },
    { title: 'Past Lives', type: 'movie' },
    { title: 'Poor Things', type: 'movie' },
    { title: 'Anatomy of a Fall', type: 'movie' },
    { title: 'The Holdovers', type: 'movie' },
    { title: 'Spider-Man: Across the Spider-Verse', type: 'movie' },
    { title: 'Guardians of the Galaxy Vol. 3', type: 'movie' },
    { title: 'Mission: Impossible - Dead Reckoning Part One', type: 'movie' },
    { title: 'John Wick: Chapter 4', type: 'movie' },
    { title: 'Everything Everywhere All at Once', type: 'movie' },
    { title: 'Top Gun: Maverick', type: 'movie' },
    { title: 'Avatar: The Way of Water', type: 'movie' },
    { title: 'Elvis', type: 'movie' },
    { title: 'Triangle of Sadness', type: 'movie' },
    { title: 'The Banshees of Inisherin', type: 'movie' },
    { title: 'Tár', type: 'movie' },
    { title: 'All Quiet on the Western Front', type: 'movie' },
    { title: 'Glass Onion: A Knives Out Mystery', type: 'movie' },
    { title: 'The Fabelmans', type: 'movie' },
    { title: 'Black Panther: Wakanda Forever', type: 'movie' },
    { title: 'The Batman', type: 'movie' },
    { title: 'Nope', type: 'movie' },
    { title: 'Doctor Strange in the Multiverse of Madness', type: 'movie' },
    { title: 'Thor: Love and Thunder', type: 'movie' },
    { title: 'Turning Red', type: 'movie' },
    { title: 'Lightyear', type: 'movie' },
    { title: 'Minions: The Rise of Gru', type: 'movie' },
    { title: 'Bullet Train', type: 'movie' },
    { title: 'Where the Crawdads Sing', type: 'movie' },
    { title: 'Amsterdam', type: 'movie' },
    { title: 'Don\'t Worry Darling', type: 'movie' },
    { title: 'Halloween Ends', type: 'movie' },
    { title: 'Black Adam', type: 'movie' },
    { title: 'The Menu', type: 'movie' },
    { title: 'Strange World', type: 'movie' },
    { title: 'Puss in Boots: The Last Wish', type: 'movie' },
    { title: 'A Man Called Otto', type: 'movie' },
    { title: 'M3GAN', type: 'movie' },
    { title: 'Creed III', type: 'movie' },
    { title: 'Ant-Man and the Wasp: Quantumania', type: 'movie' },
    { title: 'Shazam! Fury of the Gods', type: 'movie' },
    { title: 'Dungeons & Dragons: Honor Among Thieves', type: 'movie' },
    { title: 'The Super Mario Bros. Movie', type: 'movie' },
    { title: 'Renfield', type: 'movie' },
    { title: 'Evil Dead Rise', type: 'movie' },
    { title: 'Are You There God? It\'s Me, Margaret.', type: 'movie' },
    { title: 'Guardians of the Galaxy Vol. 3', type: 'movie' },
    { title: 'Fast X', type: 'movie' },
    { title: 'The Little Mermaid', type: 'movie' },
    { title: 'Spider-Man: Across the Spider-Verse', type: 'movie' },
    { title: 'Elemental', type: 'movie' },
    { title: 'Indiana Jones and the Dial of Destiny', type: 'movie' },
    { title: 'Ruby Gillman, Teenage Kraken', type: 'movie' },
    { title: 'Insidious: The Red Door', type: 'movie' },
    { title: 'Mission: Impossible - Dead Reckoning Part One', type: 'movie' },
    { title: 'Oppenheimer', type: 'movie' },
    { title: 'Barbie', type: 'movie' },
    { title: 'Haunted Mansion', type: 'movie' },
    { title: 'Teenage Mutant Ninja Turtles: Mutant Mayhem', type: 'movie' },
    { title: 'Meg 2: The Trench', type: 'movie' },
    { title: 'Blue Beetle', type: 'movie' },
    { title: 'Gran Turismo', type: 'movie' },
    { title: 'The Equalizer 3', type: 'movie' },
    { title: 'My Big Fat Greek Wedding 3', type: 'movie' },
    { title: 'A Haunting in Venice', type: 'movie' },
    { title: 'Expend4bles', type: 'movie' },
    { title: 'The Creator', type: 'movie' },
    { title: 'Saw X', type: 'movie' },
    { title: 'Paw Patrol: The Mighty Movie', type: 'movie' },
    { title: 'The Exorcist: Believer', type: 'movie' },
    { title: 'Taylor Swift: The Eras Tour', type: 'movie' },
    { title: 'Killers of the Flower Moon', type: 'movie' },
    { title: 'Five Nights at Freddy\'s', type: 'movie' },
    { title: 'Dune', type: 'movie' },
    { title: 'Arrival', type: 'movie' },
    { title: 'Joker', type: 'movie' },
    { title: 'Knives Out', type: 'movie' },
    { title: 'Your Name.', type: 'movie' },
    { title: 'Coco', type: 'movie' },
    { title: 'Paddington 2', type: 'movie' },
    { title: 'The Farewell', type: 'movie' },
    { title: 'Nomadland', type: 'movie' },


    // --- Popular Series ---
    { title: 'Breaking Bad', type: 'series' },
    { title: 'Stranger Things', type: 'series' },
    { title: 'Chernobyl', type: 'series' },
    { title: 'The Wire', type: 'series' },
    { title: 'Band of Brothers', type: 'series' },
    { title: 'Bluey', type: 'series' },
    { title: 'Our Planet', type: 'series' },
    { title: 'Cosmos: A Spacetime Odyssey', type: 'series' },
    { title: 'Avatar: The Last Airbender', type: 'series' },
    { title: 'The Sopranos', type: 'series' },
    { title: 'The Queen\'s Gambit', type: 'series' },
    { title: 'The Mandalorian', type: 'series' },
    { title: 'Dark', type: 'series' },
    { title: 'Squid Game', type: 'series' },
    { title: 'Arcane', type: 'series' },
    { title: 'Severance', type: 'series' },
    { title: 'The Boys', type: 'series' },
    { title: 'Ted Lasso', type: 'series' },
    { title: 'Succession', type: 'series' },
    { title: 'Fleabag', type: 'series' },
    { title: 'Mr. Robot', type: 'series' },
    { title: 'Peaky Blinders', type: 'series' },
    { title: 'Mindhunter', type: 'series' },
    { title: 'The Crown', type: 'series' },
    { title: 'House of the Dragon', type: 'series' },
    { title: 'Game of Thrones', type: 'series' },
    { title: 'Prison Break', type: 'series' },
    { title: 'Fallout', type: 'series' },
    { title: 'Shōgun', type: 'series' },
    { title: 'The Bear', type: 'series' },
    { title: 'Yellowstone', type: 'series' },
    { title: 'Wednesday', type: 'series' },
    { title: 'House of Cards', type: 'series' },
    { title: 'The Office', type: 'series' },
    { title: 'Friends', type: 'series' },
    { title: 'Seinfeld', type: 'series' },
    { title: 'Rick and Morty', type: 'series' },
    { title: 'Attack on Titan', type: 'series' },
    { title: 'Demon Slayer: Kimetsu no Yaiba', type: 'series' },
    { title: 'Jujutsu Kaisen', type: 'series' },
    { title: 'One Piece', type: 'series' },
    { title: 'My Hero Academia', type: 'series' },
    { title: 'The Witcher', type: 'series' },
    { title: 'Loki', type: 'series' },
    { title: 'WandaVision', type: 'series' },
    { title: 'The Falcon and the Winter Soldier', type: 'series' },
    { title: 'Hawkeye', type: 'series' },
    { title: 'Moon Knight', type: 'series' },
    { title: 'Ms. Marvel', type: 'series' },
    { title: 'She-Hulk: Attorney at Law', type: 'series' },
    { title: 'Andor', type: 'series' },
    { title: 'Obi-Wan Kenobi', type: 'series' },
    { title: 'The Book of Boba Fett', type: 'series' },
    { title: 'Ahsoka', type: 'series' },
    { title: 'Gen V', type: 'series' },
    { title: 'Invincible', type: 'series' },
    { title: 'Only Murders in the Building', type: 'series' },
    { title: 'The Last of Us', type: 'series' },
    { title: 'House of the Dragon', type: 'series' },
    { title: 'Yellowjackets', type: 'series' },
    { title: 'Severance', type: 'series' },
    { title: 'Pachinko', type: 'series' },
    { title: 'The Gilded Age', type: 'series' },
    { title: 'Winning Time: The Rise of the Lakers Dynasty', type: 'series' },
    { title: 'Our Flag Means Death', type: 'series' },
    { title: 'Reacher', type: 'series' },
    { title: 'Halo', type: 'series' },
    { title: 'Moon Knight', type: 'series' },
    { title: 'Obi-Wan Kenobi', type: 'series' },
    { title: 'Ms. Marvel', type: 'series' },
    { title: 'She-Hulk: Attorney at Law', type: 'series' },
    { title: 'Andor', type: 'series' },
    { title: 'Wednesday', type: 'series' },
    { title: '1899', type: 'series' },
    { title: 'The Recruit', type: 'series' },
    { title: 'Kaleidoscope', type: 'series' },
    { title: 'Ginny & Georgia', type: 'series' },
    { title: 'Outer Banks', type: 'series' },
    { title: 'You', type: 'series' },
    { title: 'Shadow and Bone', type: 'series' },
    { title: 'Queen Charlotte: A Bridgerton Story', type: 'series' },
    { title: 'The Diplomat', type: 'series' },
    { title: 'Beef', type: 'series' },
    { title: 'Sweet Tooth', type: 'series' },
    { title: 'FUBAR', type: 'series' },
    { title: 'The Witcher', type: 'series' },
    { title: 'Black Mirror', type: 'series' },
    { title: 'The Lincoln Lawyer', type: 'series' },
    { title: 'Manifest', type: 'series' },
    { title: 'The Night Agent', type: 'series' },
    { title: 'Stranger Things', type: 'series' },
    { title: 'Wednesday', type: 'series' },
    { title: 'Dahmer – Monster: The Jeffrey Dahmer Story', type: 'series' },
    { title: 'The Watcher', type: 'series' },
    { title: 'From Scratch', type: 'series' },
    { title: 'The Sandman', type: 'series' },
    { title: 'Inventing Anna', type: 'series' },
    { title: 'All of Us Are Dead', type: 'series' },
    { title: 'Archive 81', type: 'series' },
    { title: 'Ozark', type: 'series' },
    { title: 'Cobra Kai', type: 'series' },
    { title: 'Emily in Paris', type: 'series' },
    { title: 'Bridgerton', type: 'series' },
    { title: 'Lupin', type: 'series' },
    { title: 'Money Heist', type: 'series' },
    { title: 'Dark', type: 'series' },
    { title: 'Elite', type: 'series' },
    { title: 'The Crown', type: 'series' },
    { title: 'Narcos', type: 'series' },
    { title: 'Peaky Blinders', type: 'series' },
    { title: 'Mindhunter', type: 'series' },
    { title: 'Ozark', type: 'series' },
    { title: 'The Umbrella Academy', type: 'series' },
    { title: 'Sex Education', type: 'series' },
    { title: 'Lucifer', type: 'series' },
    { title: 'The Good Place', type: 'series' },
    { title: 'BoJack Horseman', type: 'series' },
    { title: 'Big Mouth', type: 'series' },
    { title: 'Disenchantment', type: 'series' },
    { title: 'F is for Family', type: 'series' },
    { title: 'Love, Death & Robots', type: 'series' },
    { title: 'Castlevania', type: 'series' },
    { title: 'Aggretsuko', type: 'series' },
    { title: 'Komi Can\'t Communicate', type: 'series' },
    { title: 'Cyberpunk: Edgerunners', type: 'series' },
    { title: 'Ozark', type: 'series' },
    { title: 'Cobra Kai', type: 'series' },
    { title: 'Emily in Paris', type: 'series' },
    { title: 'Bridgerton', type: 'series' },
    { title: 'Lupin', type: 'series' },
    { title: 'Money Heist', type: 'series' },
    { title: 'Dark', type: 'series' },
    { title: 'Elite', type: 'series' },
    { title: 'The Crown', type: 'series' },
    { title: 'Narcos', type: 'series' },
    { title: 'Peaky Blinders', type: 'series' },
    { title: 'Mindhunter', type: 'series' },
    { title: 'Ozark', type: 'series' },
    { title: 'The Umbrella Academy', type: 'series' },
    { title: 'Sex Education', type: 'series' },
    { title: 'Lucifer', type: 'series' },
    { title: 'The Good Place', type: 'series' },
    { title: 'BoJack Horseman', type: 'series' },
    { title: 'Big Mouth', type: 'series' },
    { title: 'Disenchantment', type: 'series' },
    { title: 'F is for Family', type: 'series' },
    { title: 'Love, Death & Robots', type: 'series' },
    { title: 'Castlevania', type: 'series' },
    { title: 'Aggretsuko', type: 'series' },
    { title: 'Komi Can\'t Communicate', type: 'series' },
    { title: 'Cyberpunk: Edgerunners', type: 'series' }
];

// --- Main Import Function ---
async function importData() {
    console.log('Connecting to MongoDB...');
    try {
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log('MongoDB connected successfully!');

        for (const item of titlesToImport) {
            // Introduce a small delay to respect OMDb API rate limits (e.g., 1000 requests/day for free tier)
            // A 100ms delay means ~10 requests per second. For 200 items, this is 20 seconds.
            await new Promise(resolve => setTimeout(resolve, 150));

            console.log(`Fetching data for: ${item.title} (${item.type})`);
            try {
                const omdbResponse = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(item.title)}&type=${item.type}&apikey=${OMDB_API_KEY}`);
                const data = omdbResponse.data;

                if (data.Response === 'True') {
                    // Prepare data for Mongoose model
                    const formattedData = {
                        imdbID: data.imdbID,
                        title: data.Title, // OMDb uses 'Title', your schema uses 'title'
                        year: data.Year,
                        type: data.Type,
                        poster: data.Poster,
                        plot: data.Plot,
                        genre: data.Genre ? data.Genre.split(', ').map(g => g.trim()) : [], // Convert comma-separated string to array
                        director: data.Director,
                        actors: data.Actors,
                        writer: data.Writer,
                        language: data.Language,
                        country: data.Country,
                        awards: data.Awards,
                        imdbRating: data.imdbRating,
                        rated: data.Rated,
                        runtime: data.Runtime,
                        boxOffice: data.BoxOffice,
                        dvd: data.DVD,
                        imdbVotes: data.imdbVotes,
                        metascore: data.Metascore,
                        production: data.Production,
                        website: data.Website,
                        totalSeasons: data.totalSeasons // Only for series
                    };

                    let Model;
                    if (item.type === 'movie') {
                        Model = Movie;
                    } else if (item.type === 'series') {
                        Model = Series;
                    } else {
                        console.warn(`Skipping unknown type: ${item.type} for ${item.title}`);
                        continue;
                    }

                    // Check if item already exists to avoid duplicates
                    const existingItem = await Model.findOne({ imdbID: formattedData.imdbID });

                    if (existingItem) {
                        console.log(`  Skipping: ${formattedData.title} (${formattedData.imdbID}) already exists.`);
                    } else {
                        const newItem = new Model(formattedData);
                        await newItem.save();
                        console.log(`  Successfully imported: ${formattedData.title} (${formattedData.imdbID})`);
                    }
                } else {
                    console.warn(`  OMDb API Error for ${item.title} (${item.type}): ${data.Error}`);
                }
            } catch (omdbError) {
                console.error(`  Error fetching/processing OMDb data for ${item.title}:`, omdbError.message);
            }
        }
        console.log('Data import process completed.');
    } catch (dbError) {
        console.error('MongoDB connection or operation error:', dbError);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

// Run the import function
importData();
