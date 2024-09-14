export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');

    // Ensure that the POST method is used
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { buttonIndex } = req.body;
    console.log('User selected answer:', buttonIndex);

    // Retrieve the correct answer and options from environment variables
    const correctAnswer = process.env.correctAnswer;
    const options = process.env.options ? JSON.parse(process.env.options) : [];

    console.log('Correct answer:', correctAnswer);
    console.log('Options presented:', options);

    if (!correctAnswer || options.length === 0) {
      return res.status(500).json({ error: 'No answer data available' });
    }

    // Check if the selected answer is correct
    const isCorrect = options[buttonIndex - 1] === correctAnswer;
    console.log('Is the user correct?', isCorrect);

    // Update the environment variables for wins and losses
    process.env.GameWins = parseInt(process.env.GameWins || '0') + (isCorrect ? 1 : 0);
    process.env.GameLoss = parseInt(process.env.GameLoss || '0') + (!isCorrect ? 1 : 0);
    process.env.gameTally = parseInt(process.env.gameTally || '0') + 1;

    console.log('Updated GameWins:', process.env.GameWins);
    console.log('Updated GameLoss:', process.env.GameLoss);
    console.log('Updated gameTally:', process.env.gameTally);

    // Generate the image response based on correctness
    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(
      isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`
    )}`;

    // Return the updated frame
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
