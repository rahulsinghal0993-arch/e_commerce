import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { ToastContainer } from '@arghya/ui';
import SignIn from './pages/SignIn.js';
import AdminDashboard from './pages/AdminDashboard.js';
import AdminOrders from './pages/AdminOrders.js';
import AdminOrderDetail from './pages/AdminOrderDetail.js';
import AdminPayments from './pages/AdminPayments.js';
import AdminCatalog from './pages/AdminCatalog.js';
import AdminInventory from './pages/AdminInventory.js';
import AdminSellers from './pages/AdminSellers.js';
import AdminSellerReview from './pages/AdminSellerReview.js';
import AdminCustomers from './pages/AdminCustomers.js';
import AdminModeration from './pages/AdminModeration.js';
import AdminCommissions from './pages/AdminCommissions.js';
import NotFound from './pages/NotFound.js';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { userRole, loading } = useAuth();
  if (loading) return null;
  if (userRole !== 'admin') return <Navigate to="/sign-in" replace />;
  return children;
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
        <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><AdminOrderDetail /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><AdminCatalog /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
        <Route path="/sellers" element={<ProtectedRoute><AdminSellers /></ProtectedRoute>} />
        <Route path="/sellers/:id/review" element={<ProtectedRoute><AdminSellerReview /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
        <Route path="/moderation" element={<ProtectedRoute><AdminModeration /></ProtectedRoute>} />
        <Route path="/commissions" element={<ProtectedRoute><AdminCommissions /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
