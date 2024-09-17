import axios from 'axios';

const omdbApiKey = '99396e0b';
const omdbApiUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}`;
let recentlyUsedMovies = [];

const popularMovies = [
  'The Shawshank Redemption', 'The Godfather', 'The Dark Knight', 'Pulp Fiction',
  'Forrest Gump', 'Inception', 'The Matrix', 'Goodfellas', 'The Silence of the Lambs',
  'Star Wars', 'Jurassic Park', 'Titanic', 'The Lord of the Rings', 'Fight Club',
  'Gladiator', 'The Avengers', 'The Lion King', 'Back to the Future', 'Terminator 2',
  'Indiana Jones and the Raiders of the Lost Ark'
];

async function getRandomMovie() {
  try {
    const randomTitle = popularMovies[Math.floor(Math.random() * popularMovies.length)];
    const searchResponse = await axios.get(`${omdbApiUrl}&t=${encodeURIComponent(randomTitle)}`);
    
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

async function getDecoyMovies(genre, excludeTitle) {
  try {
    const decoyResponse = await axios.get(`${omdbApiUrl}&type=movie&s=${encodeURIComponent(genre)}`);
    
    if (decoyResponse.data.Response === 'True' && decoyResponse.data.Search) {
      return decoyResponse.data.Search
        .filter(movie => movie.Title !== excludeTitle)
        .map(movie => movie.Title);
    } else {
      return popularMovies.filter(title => title !== excludeTitle);
    }
  } catch (error) {
    console.error('Error fetching decoy movies:', error.message);
    return popularMovies.filter(title => title !== excludeTitle);
  }
}

export default async function handler(req, res) {
  try {
    console.log('Starting plotFrame handler...');

    let movieData;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        movieData = await getRandomMovie();
        if (!recentlyUsedMovies.includes(movieData.imdbID)) {
          break;
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error.message);
      }
      attempts++;
    }

    if (!movieData) {
      throw new Error('Failed to fetch a valid movie after multiple attempts');
    }

    console.log('Movie data received:', movieData);

    recentlyUsedMovies.push(movieData.imdbID);
    if (recentlyUsedMovies.length > 10) {
      recentlyUsedMovies.shift();
    }

    const plot = movieData.Plot;
    const correctTitle = movieData.Title;
    const genre = movieData.Genre.split(",")[0];

    const decoyTitles = await getDecoyMovies(genre, correctTitle);
    const titles = [correctTitle, decoyTitles[0]].sort(() => Math.random() - 0.5);
    console.log('Final movie titles presented:', titles);

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}`;

    const newGameState = {
      correctAnswer: correctTitle,
      options: titles,
    };

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Plot Twist - Movie Guess</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${titles[0]}" />
          <meta property="fc:frame:button:2" content="${titles[1]}" />
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