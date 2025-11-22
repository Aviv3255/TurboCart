export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
          TurboCart
        </h1>
        <p className="text-xl text-text-secondary">
          AI-Powered Cart Upsells for Shopify
        </p>
        <div className="mt-8">
          <div className="spinner-cosmic mx-auto"></div>
          <p className="mt-4 text-sm text-text-secondary">Setting up your app...</p>
        </div>
      </div>
    </main>
  );
}
