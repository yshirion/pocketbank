import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerChild } from '../services/api';
import styles from './Auth.module.css';
export default function RegisterChild() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '', familyId: '' });
    const [error, setError] = useState('');
    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            await registerChild({ ...form, familyId: Number(form.familyId) });
            navigate('/login');
        }
        catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg ?? 'Registration failed.');
        }
    }
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.card, children: [_jsx("h1", { className: styles.title, children: "Join Family" }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsx("input", { className: styles.input, placeholder: "First name", value: form.firstName, onChange: (e) => set('firstName', e.target.value), required: true }), _jsx("input", { className: styles.input, placeholder: "Last name (must match family name)", value: form.lastName, onChange: (e) => set('lastName', e.target.value), required: true }), _jsx("input", { className: styles.input, placeholder: "Username", value: form.username, onChange: (e) => set('username', e.target.value), required: true }), _jsx("input", { className: styles.input, type: "password", placeholder: "Password", value: form.password, onChange: (e) => set('password', e.target.value), required: true }), _jsx("input", { className: styles.input, placeholder: "Family ID (ask your parent)", value: form.familyId, onChange: (e) => set('familyId', e.target.value), required: true }), error && _jsx("p", { className: styles.error, children: error }), _jsx("button", { className: styles.button, type: "submit", children: "Join Family" })] }), _jsx("div", { className: styles.links, children: _jsx(Link, { to: "/login", children: "Back to login" }) })] }) }));
}
