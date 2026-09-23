import { StorefrontShell } from '../../components/StorefrontShell.js';
import { AccountClient } from './AccountClient.js';

export default function AccountPage() {
  return (
    <StorefrontShell showFooter={false}>
      <AccountClient />
    </StorefrontShell>
  );
}
