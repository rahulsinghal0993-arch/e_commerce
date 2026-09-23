import { StorefrontShell } from '../../../components/StorefrontShell.js';
import { OrderDetailClient } from './OrderDetailClient.js';

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; all?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const justPlaced = sp?.placed === '1';
  // A split multi-store cart produces one order per store; checkout links
  // here with every id so the confirmation can surface all of them, not
  // just the one in the URL.
  const siblingOrderIds = (sp?.all ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && v !== id);

  return (
    <StorefrontShell showFooter={false}>
      <OrderDetailClient orderId={id} justPlaced={justPlaced} siblingOrderIds={siblingOrderIds} />
    </StorefrontShell>
  );
}
