import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-neutral-900 text-neutral-200 px-6 md:px-11 py-8 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-6 text-[13px]">
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="dev w-7 h-7 rounded-full bg-accent-2-500 text-accent-900 grid place-items-center text-[16px] pb-0.5">
            ॐ
          </span>
          <span className="font-heading text-[17px] text-neutral-100">Arghya</span>
        </div>
        <p className="m-0 opacity-75 max-w-[34ch] leading-relaxed">
          Puja samagri, havan and ready kits — delivered before your muhurat.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <strong className="font-heading font-normal">Shop</strong>
        <Link href="/category/all" className="navlink opacity-80">
          All categories
        </Link>
        <Link href="/orders" className="navlink opacity-80">
          Your orders
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <strong className="font-heading font-normal">Account</strong>
        <Link href="/sign-in" className="navlink opacity-80">
          Sign in
        </Link>
        <Link href="/sign-up" className="navlink opacity-80">
          Create an account
        </Link>
      </div>
    </footer>
  );
}
