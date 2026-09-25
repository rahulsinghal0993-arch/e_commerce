import Link from 'next/link';
import type { Category, ProductCard as ProductCardData } from '@arghya/api-client';
import { EmptyState, Button } from '@arghya/ui';
import { toProductCardList } from '@arghya/utils';
import { api } from '../../../lib/api.js';
import { StorefrontShell } from '../../../components/StorefrontShell.js';
import { ProductCard } from '../../../components/ProductCard.js';
import type { ProductListResult } from '../../../lib/serverTypes.js';

const PAGE_SIZE = 24;

async function loadCategoryData(slug: string, search: string, page: number) {
  const [categoriesRes, productsRes] = await Promise.allSettled([
    api.categories(),
    api.products({
      category: slug === 'all' ? undefined : slug,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }) as unknown as Promise<ProductListResult>,
  ]);

  const categories: Category[] = categoriesRes.status === 'fulfilled' ? (categoriesRes.value ?? []) : [];
  const products: { items: ProductCardData[]; total: number } =
    productsRes.status === 'fulfilled'
      ? { items: toProductCardList(productsRes.value?.items), total: productsRes.value?.total ?? 0 }
      : { items: [], total: 0 };

  return { categories, products, productsFailed: productsRes.status === 'rejected' };
}

async function loadSuggestions(): Promise<ProductCardData[]> {
  try {
    const res = await api.products({ limit: 4 });
    return toProductCardList(res?.items);
  } catch {
    return [];
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const search = typeof sp?.search === 'string' ? sp.search : '';
  const page = Math.max(1, Number(sp?.page) || 1);

  const { categories, products, productsFailed } = await loadCategoryData(slug, search, page);
  const current = categories.find((c) => c.slug === slug);
  const heading = slug === 'all' ? 'All samagri' : (current?.name ?? slug);
  const isEmpty = products.items.length === 0;
  const suggestions = isEmpty ? await loadSuggestions() : [];
  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (p > 1) qs.set('page', String(p));
    const query = qs.toString();
    return `/category/${slug}${query ? `?${query}` : ''}`;
  };

  return (
    <StorefrontShell>
      <div className="px-4 md:px-11 py-6 grid md:grid-cols-[220px_1fr] gap-7">
        <aside>
          <div className="font-heading text-base mb-3">Categories</div>
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/category/all"
              className={`no-underline px-3 py-2 rounded-xl ${slug === 'all' ? 'bg-accent text-bg font-bold' : 'text-text hover:bg-surface'}`}
            >
              All samagri
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`no-underline px-3 py-2 rounded-xl ${slug === c.slug ? 'bg-accent text-bg font-bold' : 'text-text hover:bg-surface'}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </aside>

        <div>
          <form action={`/category/${slug}`} method="GET" className="max-w-[420px] mb-5">
            <label htmlFor="cat-search" className="sr-only">
              Search
            </label>
            <input
              id="cat-search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search this category"
              className="fld min-h-[44px] w-full rounded-full border border-divider bg-surface px-4 text-sm outline-none focus:border-accent"
            />
          </form>

          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <h1 className="text-2xl m-0">{heading}</h1>
            <span className="text-[13px] text-neutral-700">
              {products.total} result{products.total === 1 ? '' : 's'}
            </span>
          </div>

          {isEmpty ? (
            <div>
              <EmptyState
                title={search ? `No match for “${search}”` : productsFailed ? 'The catalog is unavailable right now' : 'Nothing here yet'}
                description={
                  productsFailed
                    ? 'We could not reach the store. Please try again in a moment.'
                    : search
                      ? 'Try a different search term, or browse a category from the list.'
                      : 'New samagri and kits are added every week — check back soon.'
                }
                action={
                  <Button as={Link} href="/category/all" variant="ghost">
                    Browse all samagri
                  </Button>
                }
              />
              {suggestions.length > 0 && (
                <div className="mt-6">
                  <div className="text-[11px] tracking-wide uppercase text-neutral-700 mb-3">Popular this week</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {suggestions.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  {page > 1 && (
                    <Link href={pageHref(page - 1)} className="btn-quiet min-h-[40px] px-4 rounded-full border border-divider text-sm font-bold no-underline inline-flex items-center">
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-neutral-700">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={pageHref(page + 1)} className="btn-quiet min-h-[40px] px-4 rounded-full border border-divider text-sm font-bold no-underline inline-flex items-center">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StorefrontShell>
  );
}
