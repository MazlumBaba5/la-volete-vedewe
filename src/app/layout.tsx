import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lvvd – Listings Across Italy',
    template: '%s | Lvvd',
  },
  description:
    'The largest adult listings portal in Italy. Find companions, massage professionals and more in your city.',
  keywords: ['listings', 'companions', 'escort italy', 'massage'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
