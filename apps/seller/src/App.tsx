import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext.js';
import { ToastContainer } from '@arghya/ui';
import SellerShell from './components/SellerShell.js';
import SignIn from './pages/SignIn.js';
import SellerSignUp from './pages/SellerSignUp.js';
import SellerPending from './pages/SellerPending.js';
import SellerDashboard from './pages/SellerDashboard.js';
import SellerOrders from './pages/SellerOrders.js';
import SellerOrderDetail from './pages/SellerOrderDetail.js';
import SellerListings from './pages/SellerListings.js';
import SellerListingEdit from './pages/SellerListingEdit.js';
import SellerInventory from './pages/SellerInventory.js';
import SellerPayouts from './pages/SellerPayouts.js';
import SellerProfile from './pages/SellerProfile.js';
import NotFound from './pages/NotFound.js';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { userRole, loading } = useAuth();
  if (loading) return null;
  if (userRole !== 'seller') return <Navigate to="/sign-in" replace />;
  return <SellerShell>{children}</SellerShell>;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="animate-pulse font-heading text-xl text-neutral-700">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SellerSignUp />} />
        <Route path="/pending" element={<SellerPending />} />
        <Route path="/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><SellerOrderDetail /></ProtectedRoute>} />
        <Route path="/listings" element={<ProtectedRoute><SellerListings /></ProtectedRoute>} />
        <Route path="/listings/new" element={<ProtectedRoute><SellerListingEdit /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute><SellerListingEdit /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><SellerInventory /></ProtectedRoute>} />
        <Route path="/payouts" element={<ProtectedRoute><SellerPayouts /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
