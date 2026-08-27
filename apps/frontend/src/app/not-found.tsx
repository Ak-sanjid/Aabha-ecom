import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="aabha-container grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="font-display text-6xl text-primary">404</p>
        <h1 className="mt-2 font-display text-2xl text-ink">This page could not be found</h1>
        <p className="mt-2 text-sm text-ink-subtle">
          The link may be outdated, or the product may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-pill bg-primary px-6 py-3 text-sm font-medium text-ink"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
