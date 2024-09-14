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

    // Fetch decoy titles
    console.log('Fetching decoy titles based on genre and year...');
    const decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${movieData.data.Genre}&y=${movieData.data.Year}`);
    console.log('Decoy titles response:', decoyResponse.data);

    if (!decoyResponse || !decoyResponse.data || !decoyResponse.data.Search) {
      console.error('Error: No decoy data received.');
      return res.status(500).json({ error: 'No decoy data received' });
    }

    const decoyTitles = decoyResponse.data.Search
      .filter(movie => movie.Title !== correctTitle)
      .slice(0, 2)
      .map(movie => movie.Title);

    console.log('Selected decoy titles:', decoyTitles);

    if (decoyTitles.length < 2) {
      console.error('Error: Not enough decoy titles.');
      return res.status(500).json({ error: 'Not enough decoy titles' });
    }

    // Randomize correct title with decoys
    const titles = [correctTitle, ...decoyTitles].sort(() => Math.random() - 0.5);
    console.log('Final movie titles presented:', titles);

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(plot)}`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${titles[0]}" />
          <meta property="fc:frame:button:2" content="${titles[1]}" />
          <meta property="fc:frame:button:3" content="${titles[2]}" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
