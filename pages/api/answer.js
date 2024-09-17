export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('Request headers:', JSON.stringify(req.headers));

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { untrustedData, trustedData } = req.body;

    if (!untrustedData || !untrustedData.buttonIndex) {
      console.error('Missing buttonIndex in untrustedData');
      return res.status(400).json({ error: 'Button index is missing' });
    }

    const buttonIndex = untrustedData.buttonIndex;
    console.log('User selected answer:', buttonIndex);

    // Parse the state from untrustedData
    const stateData = untrustedData.state ? JSON.parse(decodeURIComponent(untrustedData.state)) : null;
    
    if (!stateData) {
      console.error('Missing or invalid state data');
      return res.status(400).json({ error: 'Missing or invalid state data' });
    }

    console.log('Parsed gameState:', stateData);
    
    const { correctAnswer, options } = stateData;

    if (!correctAnswer || !options || options.length === 0) {
      console.error('Invalid game state:', { correctAnswer, options });
      return res.status(400).json({ error: 'Invalid game state' });
    }

    console.log('Correct answer from gameState:', correctAnswer);
    console.log('Options presented:', options);

    // Check if the selected answer is correct
    const isCorrect = options[buttonIndex - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    console.log('Is the user correct?', isCorrect);

    // Generate the result text for the OG image
    const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(resultText)}`;

    // Send the response with the next frame
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Plot Twist - Answer</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="Next Question" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/plotFrame" />
        </head>
        <body>
          <p>${resultText}</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}