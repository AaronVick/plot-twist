import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const backgroundColor = text.includes("Correct") ? "#4caf50" : "#f44336";

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor,
          color: '#fff',
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
