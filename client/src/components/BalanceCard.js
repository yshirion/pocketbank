import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getActions } from '../services/api';
import styles from './BalanceCard.module.css';
export default function BalanceCard({ userId, balance }) {
    const [open, setOpen] = useState(false);
    const [actions, setActions] = useState([]);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        setLoaded(false);
        setActions([]);
        setOpen(false);
    }, [userId]);
    useEffect(() => {
        if (open && !loaded) {
            getActions(userId).then((r) => {
                setActions(r.data);
                setLoaded(true);
            });
        }
    }, [open, userId, loaded]);
    return (_jsxs("div", { className: styles.card, children: [_jsxs("button", { className: styles.header, onClick: () => setOpen((o) => !o), children: [_jsx("p", { className: styles.label, children: "Balance" }), _jsxs("p", { className: styles.amount, children: ["\u20AA", balance.toFixed(2)] }), _jsx("span", { className: open ? styles.chevronOpen : styles.chevron, children: "\u25BC" })] }), open && (_jsx("div", { className: styles.body, children: actions.length === 0
                    ? _jsx("p", { className: styles.empty, children: "No transactions yet." })
                    : (_jsx("ul", { className: styles.list, children: actions.map((a) => (_jsxs("li", { className: styles.item, children: [_jsx("span", { className: styles.type, children: a.type }), _jsxs("span", { className: a.positive ? styles.positive : styles.negative, children: [a.positive ? '+' : '-', "\u20AA", a.amount.toFixed(2)] }), _jsx("span", { className: styles.date, children: new Date(a.start).toLocaleDateString() })] }, a.id))) })) }))] }));
}
