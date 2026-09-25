import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product } from '@arghya/api-client';
import { ApiError } from '@arghya/api-client';
import { inr, toProductCard } from '@arghya/utils';
import { api } from '../../../lib/api.js';
import { StorefrontShell } from '../../../components/StorefrontShell.js';
import { AddToCartButton } from '../../../components/AddToCartButton.js';
import { ReviewsSection } from '../../../components/ReviewsSection.js';
import type { CustomerProduct, ProductReviewList } from '../../../lib/serverTypes.js';

async function loadProduct(id: string): Promise<CustomerProduct | null> {
  try {
    return (await api.product(id)) as unknown as CustomerProduct;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function loadReviews(id: string): Promise<ProductReviewList> {
  try {
    return (await api.productReviews(id)) as unknown as ProductReviewList;
  } catch {
    return { items: [], average: 0, count: 0 };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await api.product(id);
    return {
      title: `${product.name} — Arghya`,
      description: product.description?.slice(0, 160) || 'Pandit-verified puja samagri from Arghya.',
    };
  } catch {
    return { title: 'Product — Arghya' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([loadProduct(id), loadReviews(id)]);

  if (!product) notFound();

  const card = toProductCard(product as unknown as Product);
  const discountPercent = product.discount_percent > 0 ? product.discount_percent : null;
  const soldOut = product.stock === 0;

  return (
    <StorefrontShell>
      <div className="px-4 md:px-11 py-6 max-w-[1180px] mx-auto w-full">
        <nav className="text-xs text-neutral-700 mb-5">
          <Link href="/category/all" className="text-neutral-700">
            Shop
          </Link>
          {' · '}
          {product.category ? (
            <Link href={`/category/${product.category.slug}`} className="text-neutral-700">
              {product.category.name}
            </Link>
          ) : null}
          {' · '}
          <strong className="text-text">{product.name}</strong>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            {product.images && product.images.length > 0 ? (
              <div className="relative w-full h-[340px] md:h-[420px] rounded-3xl overflow-hidden">
                <Image
                  src={product.images[0]?.url ?? ''}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="ph h-[340px] md:h-[420px] rounded-3xl">PRODUCT IMAGE</div>
            )}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 mt-3.5 overflow-x-auto">
                {product.images.slice(1).map((img) => (
                  <Image
                    key={img.id}
                    src={img.url}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            {discountPercent && (
              <span className="tag inline-block bg-accent-2-200 text-accent-2-900 text-[11px] tracking-wide uppercase px-3 py-1 rounded-full mb-3">
                {discountPercent}% off
              </span>
            )}
            <h1 className="text-[28px] md:text-[36px] leading-tight m-0 mb-2">{product.name}</h1>
            {product.storeName && (
              <p className="text-[13px] text-neutral-700 mb-4">
                Sold by <strong className="text-text">{product.storeName}</strong>
              </p>
            )}

            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="font-heading text-[30px] md:text-[34px]">{inr(card.price)}</span>
              {card.oldPrice && <span className="text-[15px] text-neutral-700 line-through">{inr(card.oldPrice)}</span>}
            </div>
            <div className="text-xs text-neutral-700 mb-4">Inclusive of all taxes</div>

            {soldOut ? (
              <div className="mb-4 px-4 py-3 rounded-2xl bg-neutral-200 text-neutral-800 text-sm">Currently out of stock.</div>
            ) : product.stock <= 5 ? (
              <div className="mb-4 px-4 py-3 rounded-2xl bg-accent-100 text-accent-800 text-sm">Only {product.stock} left</div>
            ) : null}

            <AddToCartButton product={card} />

            {product.description && (
              <div className="border-t border-divider pt-5 mt-5">
                <h2 className="text-lg m-0 mb-2.5">About this item</h2>
                <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line m-0">{product.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              <div className="p-3.5 rounded-2xl bg-surface text-xs leading-relaxed">
                <strong className="block text-[13px] mb-0.5">Shuddh sourcing</strong>
                Temple-grade suppliers, batch tested
              </div>
              <div className="p-3.5 rounded-2xl bg-surface text-xs leading-relaxed">
                <strong className="block text-[13px] mb-0.5">Pandit-verified</strong>
                Checked against the vidhi
              </div>
            </div>

            <ReviewsSection
              productId={product.id}
              initialReviews={reviews.items ?? []}
              initialAverage={reviews.average ?? 0}
              initialCount={reviews.count ?? 0}
            />
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
