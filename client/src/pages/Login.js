import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';
import logoImg from '../assets/logo.png';
export default function Login() {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            const res = await login(username, password);
            const user = res.data;
            setUser(user);
            navigate(user.isParent ? '/parent' : '/child');
        }
        catch (err) {
            const status = err?.response;
            if (status?.data?.error === 'pending_approval') {
                setError('Your account is waiting for parent approval.');
            }
            else {
                setError('Invalid username or password.');
            }
        }
    }
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.card, children: [_jsx("img", { src: logoImg, alt: "PocketBank", className: styles.logoImg }), _jsx("h1", { className: styles.title, children: "PocketBank" }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsx("input", { className: styles.input, placeholder: "Username", value: username, onChange: (e) => setUsername(e.target.value), required: true }), _jsx("input", { className: styles.input, type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), error && _jsx("p", { className: styles.error, children: error }), _jsx("button", { className: styles.button, type: "submit", children: "Sign In" })] }), _jsxs("div", { className: styles.links, children: [_jsx(Link, { to: "/register/parent", children: "New family? Register here" }), _jsx(Link, { to: "/register/child", children: "Join existing family" })] })] }) }));
}
