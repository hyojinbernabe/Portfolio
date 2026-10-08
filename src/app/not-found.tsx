import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-[15px] tracking-[0.03em] uppercase">404</p>
      <h1 className="mt-4 font-display text-[clamp(3rem,10vw,7rem)] leading-[0.85] uppercase">
        Page not found
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        This page doesn&apos;t exist. It might have moved, or the link has a typo.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block border-b-2 border-brand pb-1 text-lg font-medium transition-colors hover:text-brand"
      >
        Back home
      </Link>
    </div>
  );
}
