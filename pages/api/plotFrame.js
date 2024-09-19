import axios from 'axios';
import { createClient } from "redis";

// Initialize Redis client
const client = createClient({
  url: `rediss://default:${process.env.RedisPassword}@${process.env.RedisEndpoint}:6379`
});

client.on("error", function(err) {
  console.error('Redis error:', err);
});

await client.connect();

const omdbApiKey = '99396e0b'; // Replace with your OMDb API key
const omdbApiUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}`;

// Fetch a random movie not in the excludeMovies array
async function getRandomMovie(excludeMovies) {
  try {
    const randomSearch = await axios.get(`${omdbApiUrl}&s=movie&page=${Math.floor(Math.random() * 100) + 1}`);
    const movies = randomSearch.data.Search;

    const availableMovies = movies.filter(movie => !excludeMovies.includes(movie.imdbID));
    const randomMovie = availableMovies[Math.floor(Math.random() * availableMovies.length)];

    const searchResponse = await axios.get(`${omdbApiUrl}&i=${encodeURIComponent(randomMovie.imdbID)}`);
    
    if (searchResponse.data.Response === 'True') {
      return searchResponse.data;
    } else {
      throw new Error('Movie not found');
    }
  } catch (error) {
    console.error('Error fetching random movie:', error.message);
    throw error;
  }
}

// Fetch decoy movies by searching for the same genre but different titles
async function getDecoyMovies(genre, excludeTitle) {
  try {
    const decoyResponse = await axios.get(`${omdbApiUrl}&s=${encodeURIComponent(genre)}&type=movie`);
    
    if (decoyResponse.data.Response === 'True' && decoyResponse.data.Search) {
      return decoyResponse.data.Search
        .filter(movie => movie.Title !== excludeTitle)
        .map(movie => movie.Title);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching decoy movies:', error.message);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    console.log('Starting plotFrame handler...');
    
    const fid = req.body?.untrustedData?.fid; // Extracting the untrusted FID
    const sessionId = `session_${fid}`;
    
    // Retrieve the movies already used in this session from Redis
    let usedMovies = await client.get(sessionId);
    usedMovies = usedMovies ? JSON.parse(usedMovies) : [];

    // Get a random movie, ensuring it hasn't been used in the session
    const movieData = await getRandomMovie(usedMovies);
    usedMovies.push(movieData.imdbID);

    // Save the updated list of used movies back to Redis
    await client.set(sessionId, JSON.stringify(usedMovies), { EX: 3600 }); // Set expiration to 1 hour

    const plot = movieData.Plot;
    const correctTitle = movieData.Title;
    const genre = movieData.Genre.split(",")[0]; // Use the first genre for fetching decoys

    // Get dynamic decoy titles based on the same genre
    const decoyTitles = await getDecoyMovies(genre, correctTitle);
    
    // Ensure there is always a decoy and correct title in the options
    const titles = [correctTitle, ...(decoyTitles.length > 0 ? [decoyTitles[0]] : [])];

    // If we only have one option, make sure the second option is a repeat of the correct one
    if (titles.length < 2) {
      titles.push(correctTitle); // Use the correct title again if no decoy available
    }

    // Randomize the order of the titles
    const shuffledTitles = titles.sort(() => Math.random() - 0.5);

    // Update the tally and pass it along in the state
    const incomingState = req.body?.untrustedData?.state ? JSON.parse(decodeURIComponent(req.body.untrustedData.state)) : null;
    const tally = incomingState?.tally || { correct: 0, incorrect: 0, total: 0 };

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}`;
    
    const newGameState = {
      correctAnswer: correctTitle,
      options: shuffledTitles,
      tally: tally // Pass the updated tally forward
    };

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Plot Twist - Movie Guess</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${shuffledTitles[0]}" />
          <meta property="fc:frame:button:2" content="${shuffledTitles[1]}" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify(newGameState))}" />
        </head>
        <body>
          <p>Guess the movie based on the plot!</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
