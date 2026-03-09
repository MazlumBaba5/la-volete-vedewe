import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Advisor Marketplace',
  description: 'Connect with professional advisors',
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
