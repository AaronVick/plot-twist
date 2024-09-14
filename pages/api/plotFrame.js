import axios from 'axios';

const omdbApiUrl = `http://www.omdbapi.com/?i=tt3896198&apikey=99396e0b`;

export default async function handler(req, res) {
  try {
    console.log('Starting plotFrame handler...');
    
    // Fetch movie data
    console.log('Fetching movie data from OMDB...');
    const movieData = await axios.get(omdbApiUrl);
    console.log('Movie data received:', movieData.data);

    if (!movieData || !movieData.data || !movieData.data.Plot) {
      console.error('Error: No movie data received.');
      return res.status(500).json({ error: 'No movie data received' });
    }

    const plot = movieData.data.Plot;
    const correctTitle = movieData.data.Title;

    // Fetch decoy titles based on genre and year
    let decoyResponse;
    try {
      console.log('Fetching decoy titles based on genre and year...');
      decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${movieData.data.Genre}&y=${movieData.data.Year}`);
      
      if (!decoyResponse || !decoyResponse.data || decoyResponse.data.Response === 'False') {
        throw new Error('No decoy data found with genre and year.');
      }
    } catch (error) {
      console.warn('Genre and year search failed. Falling back to genre only.');
      // Fallback: Search by genre only if year + genre fails
      decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${movieData.data.Genre}`);

      if (!decoyResponse || !decoyResponse.data || decoyResponse.data.Response === 'False') {
        console.warn('Fallback to genre only failed. Using default decoys.');
        // Final fallback: Use a pre-defined set of random movie titles if all else fails
        decoyResponse = { data: { Search: [
          { Title: 'The Matrix' },
          { Title: 'Inception' }
        ] }};
      }
    }

    console.log('Decoy titles response:', decoyResponse.data);

    const decoyTitles = decoyResponse.data.Search
      .filter(movie => movie.Title !== correctTitle)
      .slice(0, 1)  // Select one decoy title
      .map(movie => movie.Title);

    if (decoyTitles.length < 1) {
      console.error('Error: Not enough decoy titles.');
      return res.status(500).json({ error: 'Not enough decoy titles' });
    }

    // Randomize correct title with decoys
    const titles = [correctTitle, ...decoyTitles].sort(() => Math.random() - 0.5);
    console.log('Final movie titles presented:', titles);

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}&color=lightblue`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${titles[0]}" />
          <meta property="fc:frame:button:2" content="${titles[1]}" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
