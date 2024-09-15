import axios from 'axios';

const omdbApiUrl = `http://www.omdbapi.com/?apikey=99396e0b&s=movie`; // General search for movies

export default async function handler(req, res) {
  try {
    console.log('Starting plotFrame handler...');

    // Fetch a random list of movies based on a general search
    const searchResponse = await axios.get(omdbApiUrl);
    const movieList = searchResponse.data.Search;

    if (!movieList || movieList.length === 0) {
      console.error('Error: No movies found.');
      return res.status(500).json({ error: 'No movies found' });
    }

    // Select a random movie from the list
    const randomMovie = movieList[Math.floor(Math.random() * movieList.length)];
    console.log('Random movie selected:', randomMovie);

    // Fetch full details for the random movie
    const movieData = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&i=${randomMovie.imdbID}`);
    console.log('Movie data received:', movieData.data);

    const plot = movieData.data.Plot;
    const correctTitle = movieData.data.Title;
    const genre = movieData.data.Genre.split(",")[0];  // Use the first genre category

    // Fetch decoy titles based on genre
    let decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${encodeURIComponent(genre)}`);
    
    // Check if the decoy response contains data
    if (!decoyResponse.data.Search || decoyResponse.data.Search.length < 2) {
      console.warn('Not enough decoy movies found. Using default decoys.');
      decoyResponse = { data: { Search: [
        { Title: 'The Matrix' },
        { Title: 'Inception' }
      ] }};
    }

    const decoyTitles = decoyResponse.data.Search
      .filter(movie => movie.Title !== correctTitle)
      .slice(0, 1)  // Select only one decoy title
      .map(movie => movie.Title);

    if (decoyTitles.length < 1) {
      console.error('Error: Not enough decoy titles.');
      return res.status(500).json({ error: 'Not enough decoy titles' });
    }

    // Randomize the titles
    const titles = [correctTitle, ...decoyTitles].sort(() => Math.random() - 0.5);
    console.log('Final movie titles presented:', titles);

    // Store the correct answer and options in environment variables
    process.env.answer_Value = correctTitle;
    process.env.options = JSON.stringify(titles);

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}&color=lightblue`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${titles[0]}" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:button:2" content="${titles[1]}" />
          <meta property="fc:frame:button:2:action" content="post" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}