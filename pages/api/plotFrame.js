import axios from 'axios';

const omdbApiUrl = `http://www.omdbapi.com/?i=tt3896198&apikey=99396e0b`;

export default async function handler(req, res) {
  try {
    const movieData = await axios.get(omdbApiUrl);
    const plot = movieData.data.Plot;
    const correctTitle = movieData.data.Title;

    // Fetch decoys (same genre or similar)
    const decoyResponse = await axios.get(`http://www.omdbapi.com/?apikey=99396e0b&s=${movieData.data.Genre}&y=${movieData.data.Year}`);
    const decoyTitles = decoyResponse.data.Search
      .filter(movie => movie.Title !== correctTitle)
      .slice(0, 2)
      .map(movie => movie.Title);

    // Randomize correct title with decoys
    const titles = [correctTitle, ...decoyTitles].sort(() => Math.random() - 0.5);

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
          <meta property="fc:frame:post_url" content="https://plot-twist-nine.vercel.app/api/answer" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error generating frame:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
