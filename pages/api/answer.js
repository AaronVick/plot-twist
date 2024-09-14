import axios from 'axios';

export default async function handler(req, res) {
  const selectedAnswer = req.body.buttonIndex;
  const { correctAnswer, options } = JSON.parse(process.env.answer_Value);

  const isCorrect = options[selectedAnswer - 1] === correctAnswer;

  // Track wins and losses
  process.env.GameWins = parseInt(process.env.GameWins) + (isCorrect ? 1 : 0);
  process.env.GameLoss = parseInt(process.env.GameLoss) + (!isCorrect ? 1 : 0);
  process.env.gameTally = parseInt(process.env.gameTally) + 1;

  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(
    isCorrect ? 'Correct!' : `Incorrect. The right answer is ${correctAnswer}`
  )}`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        <meta property="fc:frame:button:1" content="Next Question" />
        <meta property="fc:frame:post_url" content="https://plot-twist-nine.vercel.app/api/plotFrame" />
      </head>
    </html>
  `);
}
