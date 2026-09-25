import Link from 'next/link';
import type { Category, ProductCard as ProductCardData } from '@arghya/api-client';
import { toProductCardList } from '@arghya/utils';
import { EmptyState } from '@arghya/ui';
import { api } from '../lib/api.js';
import { StorefrontShell } from '../components/StorefrontShell.js';
import { ProductCard } from '../components/ProductCard.js';
import type { StorefrontHeroSlide } from '../lib/serverTypes.js';

interface HomeData {
  slides: StorefrontHeroSlide[];
  categories: Category[];
  products: ProductCardData[];
  productsFailed: boolean;
}

async function loadHomeData(): Promise<HomeData> {
  const [heroRes, categoriesRes, productsRes] = await Promise.allSettled([
    api.heroSlides(),
    api.categories(),
    api.products({ limit: 8 }),
  ]);

  return {
    slides:
      heroRes.status === 'fulfilled' ? ((heroRes.value as unknown as { items?: StorefrontHeroSlide[] })?.items ?? []) : [],
    categories: categoriesRes.status === 'fulfilled' ? (categoriesRes.value ?? []) : [],
    products: productsRes.status === 'fulfilled' ? toProductCardList(productsRes.value?.items) : [],
    productsFailed: productsRes.status === 'rejected',
  };
}

export default async function HomePage() {
  const { slides, categories, products, productsFailed } = await loadHomeData();
  const hero = slides[0];

  return (
    <StorefrontShell>
      <section className="grid md:grid-cols-[1.05fr_0.95fr] bg-accent-2-100 border-b border-accent-2-300">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <span className="tag inline-block w-fit bg-accent-2-300 text-accent-2-900 text-[11px] tracking-wide uppercase px-3 py-1.5 rounded-full">
            {hero?.eyebrow ?? 'Arghya'}
          </span>
          <h1 className="text-[32px] md:text-[46px] my-4 max-w-[20ch] leading-tight">
            {hero?.title ?? 'The whole puja, ready in one box.'}
          </h1>
          <p className="text-[15px] max-w-[44ch] text-accent-2-900 mb-6 leading-relaxed">
            {hero?.description ??
              'Pandit-verified puja kits, havan samagri and bilona gau ghee — checked against the vidhi, delivered before your muhurat.'}
          </p>
          <div className="flex items-center gap-3.5 flex-wrap">
            <Link href={hero?.buttonLink || '/category/all'} className="btn min-h-[46px] rounded-full bg-accent text-bg font-heading px-6 inline-flex items-center no-underline">
              {hero?.buttonLabel ?? 'Shop the collection'}
            </Link>
            <Link href="/category/all" className="text-[14px] text-accent-2-900 font-bold no-underline">
              Browse all samagri →
            </Link>
          </div>
          <div className="flex gap-5 mt-8 text-[12px] text-accent-2-900 flex-wrap">
            <span>✓ Pandit-verified contents</span>
            <span>✓ Bilona gau ghee</span>
            <span>✓ Delivered before muhurat</span>
          </div>
        </div>
        <div className="ph min-h-[240px] md:min-h-[360px]">
          HERO IMAGE
          <br />
          kalash + marigold, warm light
        </div>
      </section>

      <div className="px-4 md:px-11 pt-8 pb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl m-0">Shop by occasion</h2>
          <p className="text-[13px] text-neutral-700 mt-1 mb-0">Kits assembled for the rite, not the aisle</p>
        </div>
        <Link href="/category/all" className="text-[13px] font-bold whitespace-nowrap">
          All categories →
        </Link>
      </div>
      {categories.length > 0 ? (
        <div className="px-4 md:px-11 pb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="card rounded-3xl bg-surface overflow-hidden no-underline text-inherit"
            >
              <div className="ph h-[110px]">{c.name.toUpperCase()}</div>
              <div className="px-4 py-3.5">
                <div className="font-heading text-[16px]">{c.name}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 md:px-11 pb-8">
          <EmptyState
            title="Categories are still loading"
            description="We could not reach the catalog service. Check back shortly."
          />
        </div>
      )}

      <div className="px-4 md:px-11 pt-2 pb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl m-0">Featured this week</h2>
        <Link href="/category/all" className="text-[13px] font-bold whitespace-nowrap">
          See all →
        </Link>
      </div>
      {products.length > 0 ? (
        <div className="px-4 md:px-11 pb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="px-4 md:px-11 pb-10">
          <EmptyState
            title={productsFailed ? 'The catalog is unavailable right now' : 'No products yet'}
            description={
              productsFailed
                ? 'We could not reach the store. Please try again in a moment.'
                : 'Check back soon — new samagri and kits are added every week.'
            }
          />
        </div>
      )}

      <div className="px-4 md:px-11 pb-10 grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-divider">
          <div className="font-heading text-[18px]">Shuddh sourcing</div>
          <p className="text-[13px] text-neutral-700 mt-1.5 mb-0 leading-relaxed">
            Every batch is checked before it reaches your kit — ghee for adulterants, kapoor for synthetic fillers.
          </p>
        </div>
        <div className="p-5 rounded-3xl border border-divider">
          <div className="font-heading text-[18px]">Pandit-verified vidhi</div>
          <p className="text-[13px] text-neutral-700 mt-1.5 mb-0 leading-relaxed">
            Item lists are checked against the vidhi so nothing is missing on the day of the rite.
          </p>
        </div>
        <div className="p-5 rounded-3xl border border-divider">
          <div className="font-heading text-[18px]">Delivered before muhurat</div>
          <p className="text-[13px] text-neutral-700 mt-1.5 mb-0 leading-relaxed">
            Every order ships with enough time to reach you before your chosen date.
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
