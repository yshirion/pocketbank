import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RegisterParent from './pages/RegisterParent';
import RegisterChild from './pages/RegisterChild';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';
function AppRoutes() {
    const { user, viewingChild, loading } = useAuth();
    if (loading)
        return _jsx("div", { style: { padding: '2rem' }, children: "Loading..." });
    if (!user) {
        return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register/parent", element: _jsx(RegisterParent, {}) }), _jsx(Route, { path: "/register/child", element: _jsx(RegisterChild, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }));
    }
    if (user.isParent && !viewingChild) {
        return (_jsxs(Routes, { children: [_jsx(Route, { path: "/parent", element: _jsx(ParentDashboard, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/parent", replace: true }) })] }));
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/child", element: _jsx(ChildDashboard, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/child", replace: true }) })] }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }));
}
