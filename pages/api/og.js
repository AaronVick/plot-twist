import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const color = searchParams.get('color') || 'lightblue';  // Softer background

  console.log('Generating OG image with text:', text, 'and background color:', color);

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: color,
          color: '#000',  // Change text color to black
          fontSize: 50,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        {text}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
