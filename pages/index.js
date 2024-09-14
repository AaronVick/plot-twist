import Head from 'next/head';

export default function Home() {
  console.log('Rendering home page...');
  
  const shareText = encodeURIComponent('Try out this movie plot guessing game!\n\nFrame by @aaronv\n\n');
  const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL)}`;

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
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content={shareLink} />
      </Head>
      <main>
        <h1>Welcome to Plot Twist!</h1>
        <p>Test your movie knowledge by guessing the correct title based on the plot.</p>
      </main>
    </div>
  );
}
