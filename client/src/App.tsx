import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RegisterParent from './pages/RegisterParent';
import RegisterChild from './pages/RegisterChild';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';

function AppRoutes() {
  const { user, viewingChild, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register/parent" element={<RegisterParent />} />
        <Route path="/register/child" element={<RegisterChild />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.isParent && !viewingChild) {
    return (
      <Routes>
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="*" element={<Navigate to="/parent" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/child" element={<ChildDashboard />} />
      <Route path="*" element={<Navigate to="/child" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
