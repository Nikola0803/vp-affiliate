import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Materials from './pages/Materials';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:storefront/login" element={<Login />} />
        <Route path="/:storefront/register" element={<Register />} />
        <Route path="/:storefront/forgot-password" element={<ForgotPassword />} />
        <Route path="/:storefront/reset-password" element={<ResetPassword />} />
        <Route path="/:storefront/dashboard" element={<Dashboard />} />
        <Route path="/:storefront/account" element={<Account />} />
        <Route path="/:storefront/materials" element={<Materials />} />
        {/* Bare aliases default to the base theme — kept for convenience/bookmarks */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<Account />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
