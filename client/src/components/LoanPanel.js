import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getLoans, createLoan, repayLoans } from '../services/api';
import styles from './Panel.module.css';
export default function LoanPanel({ userId, isParent, onAction }) {
    const [open, setOpen] = useState(false);
    const [loans, setLoans] = useState([]);
    const [amount, setAmount] = useState('');
    const [selected, setSelected] = useState([]);
    const [error, setError] = useState('');
    async function load() {
        const r = await getLoans(userId);
        setLoans(r.data);
    }
    useEffect(() => {
        load();
        setOpen(false);
        setSelected([]);
    }, [userId]);
    const total = loans.reduce((s, l) => s + l.currentAmount, 0);
    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        try {
            await createLoan({ userId, amount: Number(amount) });
            setAmount('');
            await load();
            onAction?.();
        }
        catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg ?? 'Failed.');
        }
    }
    async function handleRepay() {
        setError('');
        try {
            await repayLoans(selected);
            setSelected([]);
            await load();
            onAction?.();
        }
        catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg ?? 'Failed to repay.');
        }
    }
    function toggle(id) {
        setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    }
    return (_jsxs("div", { className: styles.expandCard, children: [_jsxs("button", { className: styles.expandHeader, onClick: () => setOpen((o) => !o), children: [_jsx("span", { className: styles.expandTitle, children: "Loans" }), _jsxs("div", { className: styles.expandRight, children: [_jsx("span", { className: loans.length === 0 ? styles.expandTotal : styles.expandTotalNeg, children: loans.length === 0 ? 'None' : `₪${total.toFixed(2)}` }), _jsx("span", { className: open ? styles.chevronOpen : styles.chevron, children: "\u25BC" })] })] }), open && (_jsxs("div", { className: styles.expandBody, children: [_jsxs("form", { onSubmit: handleCreate, className: styles.row, children: [_jsx("input", { className: styles.input, type: "number", min: "1", placeholder: "Amount (\u20AA)", value: amount, onChange: (e) => setAmount(e.target.value), required: true }), _jsx("button", { className: styles.btn, type: "submit", children: isParent ? 'Give Loan' : 'Request Loan' })] }), error && _jsx("p", { className: styles.error, children: error }), loans.length === 0
                        ? _jsx("p", { className: styles.empty, children: "No active loans." })
                        : (_jsx("ul", { className: styles.list, children: loans.map((l) => (_jsxs("li", { className: styles.item, children: [!isParent && (_jsx("input", { className: styles.checkbox, type: "checkbox", checked: selected.includes(l.id), onChange: () => toggle(l.id) })), _jsx("span", { className: styles.type, children: "Loan" }), _jsxs("span", { className: styles.tag, children: [l.interest, "%/mo"] }), _jsxs("span", { className: styles.negative, children: ["\u20AA", l.currentAmount.toFixed(2)] }), _jsx("span", { className: styles.date, children: new Date(l.start).toLocaleDateString() })] }, l.id))) })), !isParent && selected.length > 0 && (_jsx("button", { className: styles.btnDanger, style: { marginTop: '0.5rem' }, onClick: handleRepay, children: "Repay Selected" }))] }))] }));
}
