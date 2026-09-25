import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard as ProductCardData } from '@arghya/api-client';
import { inr } from '@arghya/utils';
import { QuickAddButton } from './QuickAddButton.js';

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="card rounded-3xl bg-surface overflow-hidden relative flex flex-col">
      {product.badge && (
        <span
          className={`tag absolute top-3 left-3 z-10 text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full ${
            product.badgeColor === 'error' ? 'bg-accent text-bg' : 'bg-neutral-800 text-neutral-100'
          }`}
        >
          {product.badge}
        </span>
      )}
      <Link href={`/product/${product.id}`} className="block no-underline text-inherit">
        <div className="relative w-full h-[150px]">
          <Image
            src={product.img}
            alt={product.title}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="px-4 pt-3.5">
          <div className="font-heading text-[16px] leading-tight">{product.title}</div>
          <div className="text-[12px] text-neutral-700 mt-1">
            {product.category}
            {product.storeName ? ` · ${product.storeName}` : ''}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[15px] font-bold">{inr(product.price)}</span>
            {product.oldPrice && (
              <span className="text-[12px] text-neutral-700 line-through">{inr(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 pt-3 mt-auto">
        <QuickAddButton product={product} />
      </div>
    </div>
  );
}
