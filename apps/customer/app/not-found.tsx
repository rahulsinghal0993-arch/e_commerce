import Link from 'next/link';
import { StorefrontShell } from '../components/StorefrontShell.js';

export default function NotFound() {
  return (
    <StorefrontShell showFooter={false}>
      <div className="flex-1 grid md:grid-cols-2 items-center gap-8 px-4 md:px-11 py-16 max-w-[1100px] mx-auto w-full">
        <div className="text-center md:text-left">
          <div className="dev text-6xl text-accent-300 leading-none mb-3">अर्घ्य</div>
          <h1 className="text-3xl md:text-[38px] mb-2.5">This page has gone for visarjan</h1>
          <p className="text-[15px] text-neutral-700 mb-6 max-w-[46ch] mx-auto md:mx-0 leading-relaxed">
            The link you followed does not exist any more. The shop and your orders are still here.
          </p>
          <div className="flex gap-3 justify-center md:justify-start flex-wrap">
            <Link href="/" className="btn min-h-[46px] rounded-full bg-accent text-bg font-heading px-6 inline-flex items-center no-underline">
              Back to the storefront
            </Link>
            <Link
              href="/category/all"
              className="btn-ghost min-h-[46px] rounded-full border border-accent text-accent-700 font-heading px-6 inline-flex items-center no-underline"
            >
              Browse all samagri
            </Link>
          </div>
        </div>
        <div className="ph h-[220px] md:h-[340px] rounded-3xl">
          ILLUSTRATION
          <br />
          empty thali, single diya
        </div>
      </div>
    </StorefrontShell>
  );
}
