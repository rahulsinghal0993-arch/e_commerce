import { Link } from 'react-router-dom';
import { Button } from '@arghya/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-10 text-center">
      <span className="dev grid h-14 w-14 place-items-center rounded-full bg-accent text-2xl text-accent-2-300">
        ॐ
      </span>
      <h1 className="text-3xl">Page not found</h1>
      <p className="max-w-sm text-sm text-neutral-700">
        This part of the seller console doesn't exist, or you don't have access to it.
      </p>
      <Button as={Link} to="/dashboard">
        Back to dashboard
      </Button>
    </div>
  );
}
