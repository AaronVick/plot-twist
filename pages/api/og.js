import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const color = searchParams.get('color') || 'lightblue';

  console.log('Generating OG image with text:', text, 'and background color:', color);

  // Split the text into result and stats
  const [result, stats] = text.split('\n\n');

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: color,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          {result}
        </div>
        <div style={{ fontSize: 30, textAlign: 'center' }}>
          {stats}
        </div>
      </div>
    ),
    {
      width: 1910,
      height: 1000,
    }
  );
}