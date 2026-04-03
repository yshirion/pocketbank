import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getActions } from '../services/api';
import styles from './Panel.module.css';
export default function ActionList({ userId }) {
    const [actions, setActions] = useState([]);
    useEffect(() => {
        getActions(userId).then((r) => setActions(r.data));
    }, [userId]);
    return (_jsxs("div", { className: styles.panel, children: [_jsx("h2", { className: styles.heading, children: "Transaction History" }), actions.length === 0 && _jsx("p", { className: styles.empty, children: "No transactions yet." }), _jsx("ul", { className: styles.list, children: actions.map((a) => (_jsxs("li", { className: styles.item, children: [_jsx("span", { className: styles.type, children: a.type }), _jsxs("span", { className: a.positive ? styles.positive : styles.negative, children: [a.positive ? '+' : '-', "\u20AA", a.amount.toFixed(2)] }), _jsx("span", { className: styles.date, children: new Date(a.start).toLocaleDateString() })] }, a.id))) })] }));
}
