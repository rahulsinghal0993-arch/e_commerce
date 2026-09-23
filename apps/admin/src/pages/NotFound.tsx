import { Link } from 'react-router-dom';
import { Button } from '@arghya/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-10 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <Button as={Link} to="/dashboard">
        Back to dashboard
      </Button>
    </div>
  );
}
