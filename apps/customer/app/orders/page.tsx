import { StorefrontShell } from '../../components/StorefrontShell.js';
import { OrdersClient } from './OrdersClient.js';

export default function OrdersPage() {
  return (
    <StorefrontShell showFooter={false}>
      <OrdersClient />
    </StorefrontShell>
  );
}
