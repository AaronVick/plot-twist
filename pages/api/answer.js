import axios from 'axios';

export default async function handler(req, res) {
  console.log('Starting answer handler...');
  const selectedAnswer = req.body.buttonIndex;
  console.log('User selected answer:', selectedAnswer);

  const { correctAnswer, options } = JSON.parse(process.env.answer_Value || '{}');
  console.log('Correct answer:', correctAnswer);
  console.log('Options presented:', options);

  const isCorrect = options[selectedAnswer - 1] === correctAnswer;
  console.log('Is the user correct?', isCorrect);

  // Track wins and losses
  process.env.GameWins = parseInt(process.env.GameWins || '0') + (isCorrect ? 1 : 0);
  process.env.GameLoss = parseInt(process.env.GameLoss || '0') + (!isCorrect ? 1 : 0);
  process.env.gameTally = parseInt(process.env.gameTally || '0') + 1;

  console.log('Updated GameWins:', process.env.GameWins);
  console.log('Updated GameLoss:', process.env.GameLoss);
  console.log('Updated gameTally:', process.env.gameTally);

  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?text=${encodeURIComponent(
    isCorrect ? 'Correct!' : `Incorrect. The right answer is ${correctAnswer}`
  )}`;

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
}
