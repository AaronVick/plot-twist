export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { untrustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;
    
    if (!buttonIndex) {
      console.error('Missing buttonIndex in the request body');
      return res.status(400).json({ error: 'Button index is missing' });
    }
    console.log('User selected answer:', buttonIndex);

    const correctAnswer = process.env.answer_Value;
    const options = process.env.options ? JSON.parse(process.env.options) : [];

    console.log('Correct answer from environment:', correctAnswer);
    console.log('Options presented:', options);

    if (!correctAnswer || options.length === 0) {
      return res.status(500).json({ error: 'No answer data available' });
    }

    const isCorrect = options[buttonIndex - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    console.log('Is the user correct?', isCorrect);

    // Update game statistics
    const gameWins = parseInt(process.env.GameWins || '0') + (isCorrect ? 1 : 0);
    const gameLoss = parseInt(process.env.GameLoss || '0') + (!isCorrect ? 1 : 0);
    const gameTally = parseInt(process.env.gameTally || '0') + 1;

    process.env.GameWins = gameWins.toString();
    process.env.GameLoss = gameLoss.toString();
    process.env.gameTally = gameTally.toString();

    console.log('Updated GameWins:', gameWins);
    console.log('Updated GameLoss:', gameLoss);
    console.log('Updated gameTally:', gameTally);

    // Generate the text for the OG image
    const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`;
    const statsText = `Total: ${gameTally} | Correct: ${gameWins} | Incorrect: ${gameLoss}`;
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
        </head>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}