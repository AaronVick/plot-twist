import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Plot Twist - Guess the Movie</title>
        <meta property="og:title" content="Plot Twist - Guess the Movie" />
        <meta property="og:image" content="https://plot-twist-nine.vercel.app/plotTwist.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://plot-twist-nine.vercel.app/plotTwist.png" />
        <meta property="fc:frame:button:1" content="Play the Game" />
        <meta property="fc:frame:post_url" content="https://plot-twist-nine.vercel.app/api/plotFrame" />
      </Head>
      <main>
        <h1>Welcome to Plot Twist!</h1>
        <p>Test your movie knowledge by guessing the correct title based on the plot.</p>
      </main>
    </div>
  );
}
