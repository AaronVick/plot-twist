export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Retrieve the selected button index and game state
    const { untrustedData, trustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;

    if (!buttonIndex) {
      console.error('Missing buttonIndex in the request body');
      return res.status(400).json({ error: 'Button index is missing' });
    }
    console.log('User selected answer:', buttonIndex);

    // Retrieve the game state passed from the plotFrame
    const gameState = JSON.parse(trustedData?.stateData || '{}');
    const { correctAnswer, options } = gameState;

    console.log('Correct answer from gameState:', correctAnswer);
    console.log('Options presented:', options);

    if (!correctAnswer || !options || options.length === 0) {
      return res.status(400).json({ error: 'Invalid game state' });
    }

    // Check if the selected answer is correct
    const isCorrect = options[buttonIndex - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    console.log('Is the user correct?', isCorrect);

    // Generate the result text for the OG image
    const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(resultText)}`;

    // Send the response with the next frame
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="Next Question" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/plotFrame" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
