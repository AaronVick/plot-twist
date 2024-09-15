export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Retrieve the selected button index and game state from the request body
    const { untrustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;

    if (!buttonIndex) {
      console.error('Missing buttonIndex in the request body');
      return res.status(400).json({ error: 'Button index is missing' });
    }
    console.log('User selected answer:', buttonIndex);

    // Retrieve the answer_Value from the environment variable (previously set in plotFrame.js)
    const correctAnswer = process.env.answer_Value;
    if (!correctAnswer) {
      console.error('Missing correct answer in environment variable');
      return res.status(500).json({ error: 'Game state is invalid: no correct answer available.' });
    }

    // Check if the selected answer is correct
    const isCorrect = buttonIndex === parseInt(correctAnswer);
    console.log('Is the user correct?', isCorrect);

    // Update game tally
    let gameTally = parseInt(process.env.gameTally || 0);
    let gameWins = parseInt(process.env.GameWins || 0);
    let gameLosses = parseInt(process.env.GameLoss || 0);

    gameTally += 1;
    if (isCorrect) {
      gameWins += 1;
    } else {
      gameLosses += 1;
    }

    // Update environment variables
    process.env.gameTally = gameTally.toString();
    process.env.GameWins = gameWins.toString();
    process.env.GameLoss = gameLosses.toString();

    // Generate result text for the OG image
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
          <div style="font-size: 14px; margin-top: 20px;">
            Correct: ${gameWins} <br />
            Incorrect: ${gameLosses} <br />
            Total Answered: ${gameTally}
          </div>
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
