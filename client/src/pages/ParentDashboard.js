import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFamilyChildren, getFamily, updateInterests, logout, createAction, confirmChild, promoteToParent, deleteUser } from '../services/api';
import styles from './Dashboard.module.css';
import logoImg from '../assets/logo.png';
export default function ParentDashboard() {
    const { user, setUser, setViewingChild } = useAuth();
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [family, setFamily] = useState(null);
    const [editingInterests, setEditingInterests] = useState(false);
    const [interests, setInterests] = useState({ loanInterest: 0, investLongInterest: 0, investShortInterest: 0 });
    const [addMoneyChildId, setAddMoneyChildId] = useState(null);
    const [moneyForm, setMoneyForm] = useState({ amount: '', type: '', positive: true });
    async function load() {
        const [childRes, familyRes] = await Promise.all([
            getFamilyChildren(user.familyId),
            getFamily(user.familyId),
        ]);
        setChildren(childRes.data);
        const f = familyRes.data;
        setFamily(f);
        setInterests({ loanInterest: f.loanInterest, investLongInterest: f.investLongInterest, investShortInterest: f.investShortInterest });
    }
    useEffect(() => { load(); }, []);
    function viewChild(child) {
        setViewingChild(child);
        navigate('/child');
    }
    async function handleSaveInterests() {
        await updateInterests(user.familyId, interests);
        setEditingInterests(false);
        await load();
    }
    async function handleAddMoney(childId) {
        const amount = parseFloat(moneyForm.amount);
        if (!amount || amount <= 0 || !moneyForm.type.trim())
            return;
        await createAction({ userId: childId, positive: moneyForm.positive, type: moneyForm.type.trim(), amount });
        setAddMoneyChildId(null);
        setMoneyForm({ amount: '', type: '', positive: true });
        await load();
    }
    async function handleConfirm(childId) {
        await confirmChild(childId);
        await load();
    }
    async function handleDeny(child) {
        if (!confirm(`Deny ${child.firstName}? This will delete their account.`))
            return;
        await deleteUser(child.id);
        await load();
    }
    async function handlePromotePending(child) {
        if (!confirm(`Make ${child.firstName} a parent? Their account will be confirmed and promoted.`))
            return;
        await confirmChild(child.id);
        await promoteToParent(child.id);
        await load();
    }
    async function handleLogout() {
        await logout();
        setUser(null);
        navigate('/login');
    }
    return (_jsxs("div", { className: styles.page, children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { className: styles.logoArea, children: [_jsx("img", { src: logoImg, alt: "", className: styles.logoImg }), _jsx("span", { className: styles.logoText, children: "PocketBank" })] }), _jsxs("span", { className: styles.headerName, children: ["Hi, ", user?.firstName, " ", user?.lastName, " (Family ID: ", user?.familyId, ")"] }), _jsx("button", { className: styles.logoutBtn, onClick: handleLogout, children: "Logout" })] }), _jsxs("main", { className: styles.main, children: [_jsxs("div", { className: styles.card, children: [children.filter(c => !c.isConfirmed).map((child) => (_jsxs("div", { className: styles.pendingCard, children: [_jsxs("div", { className: styles.pendingInfo, children: [_jsxs("span", { className: styles.pendingName, children: [child.firstName, " ", child.lastName] }), _jsx("span", { className: styles.pendingLabel, children: "Waiting for approval" })] }), _jsxs("div", { className: styles.pendingActions, children: [_jsx("button", { className: styles.confirmBtn, onClick: () => handleConfirm(child.id), children: "Confirm" }), _jsx("button", { className: styles.deleteBtn, onClick: () => handleDeny(child), children: "Deny" }), _jsx("button", { className: styles.promoteBtn, onClick: () => handlePromotePending(child), children: "Make Parent" })] })] }, child.id))), children.filter(c => c.isConfirmed).length === 0 && children.filter(c => !c.isConfirmed).length === 0 && (_jsx("p", { className: styles.empty, children: "No children yet. Share your Family ID with them." })), children.filter(c => c.isConfirmed).map((child) => (_jsxs("div", { className: styles.childCard, children: [_jsxs("div", { className: styles.childCardNav, onClick: () => viewChild(child), children: [_jsxs("span", { className: styles.childCardName, children: [child.firstName, " ", child.lastName] }), _jsxs("span", { className: styles.childCardBalance, children: ["\u20AA", child.balance.toFixed(2)] })] }), _jsx("div", { className: styles.childCardFooter, children: _jsx("button", { className: styles.addMoneyBtn, onClick: () => {
                                                setAddMoneyChildId(addMoneyChildId === child.id ? null : child.id);
                                                setMoneyForm({ amount: '', type: '', positive: true });
                                            }, children: addMoneyChildId === child.id ? 'Cancel' : '+ Add Money' }) }), addMoneyChildId === child.id && (_jsxs("div", { className: styles.moneyForm, children: [_jsxs("div", { className: styles.moneyToggle, children: [_jsx("button", { className: moneyForm.positive ? styles.activePos : styles.editBtn, onClick: () => setMoneyForm((f) => ({ ...f, positive: true })), children: "+ Income" }), _jsx("button", { className: !moneyForm.positive ? styles.activeNeg : styles.deleteBtn, onClick: () => setMoneyForm((f) => ({ ...f, positive: false })), children: "\u2212 Expense" })] }), _jsx("input", { className: styles.moneyInput, type: "number", min: "0", step: "0.01", placeholder: "Amount (\u20AA)", value: moneyForm.amount, onChange: (e) => setMoneyForm((f) => ({ ...f, amount: e.target.value })) }), _jsx("input", { className: styles.moneyInput, type: "text", placeholder: "Description (e.g. Allowance)", value: moneyForm.type, onChange: (e) => setMoneyForm((f) => ({ ...f, type: e.target.value })) }), _jsx("button", { className: styles.editBtn, onClick: () => handleAddMoney(child.id), children: "Save" })] }))] }, child.id)))] }), _jsxs("div", { className: styles.card, children: [_jsx("h2", { className: styles.sectionTitle, children: "Interest Rates" }), !editingInterests ? (_jsxs("div", { children: [_jsxs("p", { children: ["Loan: ", family?.loanInterest, "%/month"] }), _jsxs("p", { children: ["Investment (short): ", family?.investShortInterest, "%/month"] }), _jsxs("p", { children: ["Investment (long): ", family?.investLongInterest, "%/month"] }), _jsx("button", { className: styles.editBtn, onClick: () => setEditingInterests(true), children: "Edit" })] })) : (_jsxs("div", { className: styles.interestForm, children: [_jsxs("label", { children: ["Loan interest (%/month)", _jsx("input", { type: "number", step: "0.01", value: interests.loanInterest, onChange: (e) => setInterests((i) => ({ ...i, loanInterest: Number(e.target.value) })) })] }), _jsxs("label", { children: ["Short-term invest (%/month)", _jsx("input", { type: "number", step: "0.01", value: interests.investShortInterest, onChange: (e) => setInterests((i) => ({ ...i, investShortInterest: Number(e.target.value) })) })] }), _jsxs("label", { children: ["Long-term invest (%/month)", _jsx("input", { type: "number", step: "0.01", value: interests.investLongInterest, onChange: (e) => setInterests((i) => ({ ...i, investLongInterest: Number(e.target.value) })) })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [_jsx("button", { className: styles.editBtn, onClick: handleSaveInterests, children: "Save" }), _jsx("button", { className: styles.deleteBtn, onClick: () => setEditingInterests(false), children: "Cancel" })] })] }))] })] })] }));
}
