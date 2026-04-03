import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logout, getMe, getFamilyChildren, deleteUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import LoanPanel from '../components/LoanPanel';
import InvestPanel from '../components/InvestPanel';
import MessagingHub from '../components/MessagingHub';
import styles from './Dashboard.module.css';
import logoImg from '../assets/logo.png';
export default function ChildDashboard() {
    const { user, viewingChild, setUser, setViewingChild } = useAuth();
    const navigate = useNavigate();
    const [totalUnread, setTotalUnread] = useState(0);
    const child = viewingChild ?? user;
    const isParentViewing = viewingChild !== null;
    const [balance, setBalance] = useState(child.balance);
    async function refreshBalance() {
        if (!isParentViewing) {
            const res = await getMe();
            const fresh = res.data;
            setUser(fresh);
            setBalance(fresh.balance);
        }
        else {
            const res = await getFamilyChildren(user.familyId);
            const fresh = res.data.find((c) => c.id === child.id);
            if (fresh)
                setBalance(fresh.balance);
        }
    }
    async function handleLogout() {
        await logout();
        setUser(null);
        setViewingChild(null);
        navigate('/login');
    }
    function handleBack() {
        setViewingChild(null);
        navigate('/parent');
    }
    async function handleRemove() {
        if (!confirm(`Delete ${child.firstName}? This cannot be undone.`))
            return;
        await deleteUser(child.id);
        setViewingChild(null);
        navigate('/parent');
    }
    return (_jsxs("div", { className: styles.page, children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.logoArea, children: [_jsx("img", { src: logoImg, alt: "", className: styles.logoImg }), _jsx("span", { className: styles.logoText, children: "PocketBank" })] }), _jsxs("span", { className: styles.headerName, children: ["Hi, ", user?.firstName, " ", user?.lastName, " (Family ID: ", user?.familyId, ")"] }), _jsxs("div", { className: styles.headerActions, children: [totalUnread > 0 && (_jsxs("span", { className: styles.unreadBadge, children: [totalUnread, " new ", totalUnread === 1 ? 'message' : 'messages'] })), isParentViewing
                                ? _jsx("button", { className: styles.logoutBtn, onClick: handleBack, children: "\u2190 Back to family" })
                                : _jsx("button", { className: styles.logoutBtn, onClick: handleLogout, children: "Logout" })] })] }), isParentViewing && (_jsx("div", { className: styles.parentActionBar, children: _jsx("button", { className: styles.dangerBtn, onClick: handleRemove, children: "Remove Child" }) })), _jsxs("div", { className: styles.childLayoutWithChat, children: [_jsxs("div", { className: styles.childCards, children: [_jsxs("div", { className: styles.childSectionName, children: [child.firstName, " ", child.lastName] }), _jsx(BalanceCard, { userId: child.id, balance: balance }), _jsx(LoanPanel, { userId: child.id, isParent: isParentViewing, onAction: refreshBalance }), _jsx(InvestPanel, { userId: child.id, isParent: isParentViewing, onAction: refreshBalance })] }), _jsx("div", { className: styles.childSidebar, children: isParentViewing
                            ? _jsx(MessagingHub, { userId: user.id, familyId: user.familyId, isParent: true, preSelectedId: child.id, onUnreadChange: setTotalUnread })
                            : _jsx(MessagingHub, { userId: child.id, familyId: child.familyId, isParent: false, onUnreadChange: setTotalUnread }) })] })] }));
}
