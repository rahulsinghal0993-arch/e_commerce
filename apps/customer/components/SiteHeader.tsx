import Link from 'next/link';
import { api } from '../lib/api.js';
import { HeaderCartLink } from './HeaderCartLink.js';
import { HeaderAuthLinks } from './HeaderAuthLinks.js';

async function loadNavCategories() {
  try {
    const categories = await api.categories();
    return Array.isArray(categories) ? categories.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export async function SiteHeader() {
  const categories = await loadNavCategories();

  return (
    <header className="flex flex-wrap items-center gap-4 md:gap-6 bg-accent px-4 md:px-8 py-3 text-bg">
      <Link href="/" className="flex items-center gap-2 shrink-0 no-underline text-bg">
        <span className="dev w-8 h-8 rounded-full bg-accent-2-500 text-accent-900 grid place-items-center text-[17px] pb-0.5">
          ॐ
        </span>
        <span className="font-heading text-[19px]">Arghya</span>
      </Link>

      <nav className="hidden lg:flex items-center gap-5">
        {categories.length > 0 ? (
          categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="navlink">
              {c.name}
            </Link>
          ))
        ) : (
          <Link href="/category/all" className="navlink">
            Shop
          </Link>
        )}
      </nav>

      <form action="/category/all" method="GET" className="flex-1 max-w-[360px] order-3 lg:order-none w-full lg:w-auto">
        <label htmlFor="site-search" className="sr-only">
          Search the store
        </label>
        <input
          id="site-search"
          name="search"
          type="search"
          placeholder="Search “Satyanarayan kit”"
          className="fld min-h-[38px] w-full rounded-full border border-transparent bg-white/15 px-4 text-sm text-bg placeholder:text-bg/70 outline-none focus:border-bg/60"
        />
      </form>

      <div className="ml-auto flex items-center gap-4">
        <HeaderAuthLinks />
        <HeaderCartLink light />
      </div>
    </header>
  );
}
