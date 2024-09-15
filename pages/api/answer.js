export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { untrustedData, trustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;
    
    if (!buttonIndex) {
      console.error('Missing buttonIndex in the request body');
      return res.status(400).json({ error: 'Button index is missing' });
    }
    console.log('User selected answer:', buttonIndex);

    // Retrieve game state from trustedData
    const gameState = JSON.parse(trustedData?.stateData || '{}');
    const { correctAnswer, options, gameWins = 0, gameLoss = 0, gameTally = 0 } = gameState;

    console.log('Correct answer from gameState:', correctAnswer);
    console.log('Options presented:', options);

    if (!correctAnswer || !options || options.length === 0) {
      return res.status(400).json({ error: 'Invalid game state' });
    }

    const isCorrect = options[buttonIndex - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    console.log('Is the user correct?', isCorrect);

    // Update game statistics
    const newGameWins = gameWins + (isCorrect ? 1 : 0);
    const newGameLoss = gameLoss + (!isCorrect ? 1 : 0);
    const newGameTally = gameTally + 1;

    console.log('Updated GameWins:', newGameWins);
    console.log('Updated GameLoss:', newGameLoss);
    console.log('Updated gameTally:', newGameTally);

    // Generate the text for the OG image
    const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`;
    const statsText = `Total: ${newGameTally} | Correct: ${newGameWins} | Incorrect: ${newGameLoss}`;
    const ogText = `${resultText}\n\n${statsText}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(ogText)}`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="Next Question" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/plotFrame" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({
            gameWins: newGameWins,
            gameLoss: newGameLoss,
            gameTally: newGameTally
          }))}" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}