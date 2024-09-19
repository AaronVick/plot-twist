import { createClient } from "redis";

// Initialize Redis client
const client = createClient({
  url: `rediss://default:${process.env.RedisPassword}@${process.env.RedisEndpoint}:6379`
});

client.on("error", function(err) {
  console.error('Redis error:', err);
});

await client.connect();

export default async function handler(req, res) {
  try {
    console.log('Starting answer handler...');
    const { untrustedData } = req.body;

    if (!untrustedData || !untrustedData.buttonIndex) {
      console.error('Missing buttonIndex in untrustedData');
      return res.status(400).json({ error: 'Button index is missing' });
    }

    const fid = untrustedData.fid; // Extracting FID
    const sessionId = `session_${fid}`;

    const stateData = untrustedData.state ? JSON.parse(decodeURIComponent(untrustedData.state)) : null;
    const updatedTally = stateData?.tally || { correct: 0, incorrect: 0, total: 0 };

    const correctAnswer = stateData.correctAnswer;
    const options = stateData.options;

    const buttonIndex = untrustedData.buttonIndex;
    const isCorrect = options[buttonIndex - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    // Update the tally
    if (isCorrect) {
      updatedTally.correct += 1;
    } else {
      updatedTally.incorrect += 1;
    }
    updatedTally.total += 1;

    const resultText = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`;
    const tallyText = `Correct: ${updatedTally.correct} | Incorrect: ${updatedTally.incorrect} | Total: ${updatedTally.total}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(resultText)}&subtext=${encodeURIComponent(tallyText)}`;

    // Send the updated tally and image response
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
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ tally: updatedTally }))}" />
        </head>
        <body>
          <p>${resultText}</p>
          <p>${tallyText}</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing answer:', error.message);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
