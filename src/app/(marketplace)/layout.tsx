export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>Marketplace Navigation</nav>
      <main>{children}</main>
    </div>
  );
}
