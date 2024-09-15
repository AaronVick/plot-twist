import axios from 'axios';

const omdbApiUrl = `http://www.omdbapi.com/?apikey=99396e0b&s=movie`;

export default async function handler(req, res) {
  try {
    console.log('Starting plotFrame handler...');

    // Fetch a random list of movies
    const searchResponse = await axios.get(omdbApiUrl);
    const movieList = searchResponse.data.Search;

    if (!movieList || movieList.length === 0) {
      console.error('Error: No movies found.');
      return res.status(500).json({ error: 'No movies found' });
    }

    // Select a random movie
    const randomMovie = movieList[Math.floor(Math.random() * movieList.length)];
    console.log('Random movie selected:', randomMovie);

    const movieData = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&i=${randomMovie.imdbID}`);
    console.log('Movie data received:', movieData.data);

    const plot = movieData.data.Plot;
    const correctTitle = movieData.data.Title;
    const genre = movieData.data.Genre.split(",")[0];  // Use the first genre category

    // Fetch decoy titles based on genre
    let decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${encodeURIComponent(genre)}`);
    
    if (!decoyResponse.data.Search || decoyResponse.data.Search.length < 2) {
      console.warn('Not enough decoy movies found. Using default decoys.');
      decoyResponse = { data: { Search: [
        { Title: 'The Matrix' },
        { Title: 'Inception' }
      ] }};
    }

    const decoyTitles = decoyResponse.data.Search
      .filter(movie => movie.Title !== correctTitle)
      .slice(0, 1)
      .map(movie => movie.Title);

    const titles = [correctTitle, ...decoyTitles].sort(() => Math.random() - 0.5);
    console.log('Final movie titles presented:', titles);

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}`;

    // Encode game state (including correctAnswer and options)
    const newGameState = {
      correctAnswer: correctTitle,
      options: titles,
    };

    // Send the frame
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${titles[0]}" />
          <meta property="fc:frame:button:1:post_body" content="buttonIndex=1" /> 
          <meta property="fc:frame:button:2" content="${titles[1]}" />
          <meta property="fc:frame:button:2:post_body" content="buttonIndex=2" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify(newGameState))}" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
