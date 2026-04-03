import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getInvests, createInvest, withdrawInvests } from '../services/api';
import styles from './Panel.module.css';
export default function InvestPanel({ userId, isParent, onAction }) {
    const [open, setOpen] = useState(false);
    const [invests, setInvests] = useState([]);
    const [amount, setAmount] = useState('');
    const [longTerm, setLongTerm] = useState(false);
    const [error, setError] = useState('');
    async function load() {
        const r = await getInvests(userId);
        setInvests(r.data);
    }
    useEffect(() => {
        load();
        setOpen(false);
    }, [userId]);
    const total = invests.reduce((s, i) => s + i.currentAmount, 0);
    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        try {
            await createInvest({ userId, amount: Number(amount), longTerm });
            setAmount('');
            setLongTerm(false);
            await load();
            onAction?.();
        }
        catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg ?? 'Failed to invest.');
        }
    }
    async function handleRelease(id) {
        setError('');
        try {
            await withdrawInvests([id]);
            await load();
            onAction?.();
        }
        catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg ?? 'Failed to release.');
        }
    }
    return (_jsxs("div", { className: styles.expandCard, children: [_jsxs("button", { className: styles.expandHeader, onClick: () => setOpen((o) => !o), children: [_jsx("span", { className: styles.expandTitle, children: "Investments" }), _jsxs("div", { className: styles.expandRight, children: [_jsx("span", { className: invests.length === 0 ? styles.expandTotal : styles.expandTotalPos, children: invests.length === 0 ? 'None' : `₪${total.toFixed(2)}` }), _jsx("span", { className: open ? styles.chevronOpen : styles.chevron, children: "\u25BC" })] })] }), open && (_jsxs("div", { className: styles.expandBody, children: [!isParent && (_jsxs("form", { onSubmit: handleCreate, className: styles.row, children: [_jsx("input", { className: styles.input, type: "number", min: "1", placeholder: "Amount (\u20AA)", value: amount, onChange: (e) => setAmount(e.target.value), required: true }), _jsxs("div", { className: styles.termToggle, children: [_jsx("button", { type: "button", className: !longTerm ? styles.termOptionActive : styles.termOption, onClick: () => setLongTerm(false), children: "Short \u00B7 1 mo" }), _jsx("button", { type: "button", className: longTerm ? styles.termOptionActive : styles.termOption, onClick: () => setLongTerm(true), children: "Long \u00B7 6 mo" })] }), _jsx("button", { className: styles.btn, type: "submit", children: "Invest" })] })), error && _jsx("p", { className: styles.error, children: error }), invests.length === 0
                        ? _jsx("p", { className: styles.empty, children: "No active investments." })
                        : (_jsx("ul", { className: styles.list, children: invests.map((inv) => {
                                const matured = new Date() >= new Date(inv.end);
                                return (_jsxs("li", { className: styles.item, children: [_jsx("span", { className: styles.type, children: inv.longTerm ? 'Long-term' : 'Short-term' }), _jsxs("span", { className: styles.tag, children: [inv.interest, "%/mo"] }), _jsxs("span", { className: styles.positive, children: ["\u20AA", inv.currentAmount.toFixed(2)] }), matured
                                            ? isParent && (_jsx("button", { className: styles.btnSmall, onClick: () => handleRelease(inv.id), children: "Release" }))
                                            : _jsxs("span", { className: styles.date, children: ["from ", new Date(inv.end).toLocaleDateString()] })] }, inv.id));
                            }) }))] }))] }));
}
