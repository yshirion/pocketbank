import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getInbox, getSent, sendMessage, markRead, getFamilyChildren, getFamilyParents } from '../services/api';
import styles from './Panel.module.css';
export default function MessagePanel({ userId, familyId, isParent, readOnly = false, }) {
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [tab, setTab] = useState('inbox');
    const [content, setContent] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [recipientId, setRecipientId] = useState(null);
    const [error, setError] = useState('');
    async function load() {
        const [inRes, outRes] = await Promise.all([getInbox(userId), getSent(userId)]);
        const inboxMessages = inRes.data;
        setInbox(inboxMessages);
        setSent(outRes.data);
        const unread = inboxMessages.filter((m) => !m.isRead).map((m) => m.id);
        if (unread.length > 0)
            await markRead(unread);
    }
    useEffect(() => {
        load();
    }, [userId]);
    useEffect(() => {
        if (readOnly)
            return;
        const fetcher = isParent ? getFamilyChildren : getFamilyParents;
        fetcher(familyId).then((r) => {
            const list = r.data;
            setRecipients(list);
            setRecipientId(null);
        });
    }, [familyId, isParent, readOnly]);
    async function handleSend(e) {
        e.preventDefault();
        setError('');
        if (!recipientId) {
            setError('No recipient available.');
            return;
        }
        try {
            await sendMessage({ receiverId: recipientId, content });
            setContent('');
            await load();
        }
        catch {
            setError('Failed to send message.');
        }
    }
    const messages = tab === 'inbox' ? inbox : sent;
    const unreadCount = inbox.filter((m) => !m.isRead).length;
    return (_jsxs("div", { className: styles.panel, children: [_jsx("h2", { className: styles.heading, children: "Messages" }), _jsxs("div", { className: styles.row, children: [_jsxs("button", { className: tab === 'inbox' ? styles.btn : styles.btnDanger, onClick: () => setTab('inbox'), children: ["Inbox", unreadCount > 0 ? ` (${unreadCount})` : ''] }), _jsx("button", { className: tab === 'sent' ? styles.btn : styles.btnDanger, onClick: () => setTab('sent'), children: "Sent" })] }), messages.length === 0 && _jsx("p", { className: styles.empty, children: "No messages." }), _jsx("ul", { className: styles.list, children: messages.map((m) => (_jsxs("li", { className: styles.item, style: { fontWeight: tab === 'inbox' && !m.isRead ? 700 : 400 }, children: [_jsx("span", { className: styles.type, children: tab === 'inbox' ? m.senderName : 'You' }), _jsx("span", { style: { flex: 2 }, children: m.content }), _jsx("span", { className: styles.date, children: new Date(m.createdAt).toLocaleDateString() })] }, m.id))) }), !readOnly && (_jsxs("form", { onSubmit: handleSend, style: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [recipients.length > 0 && (_jsxs("select", { className: styles.input, value: recipientId ?? '', onChange: (e) => setRecipientId(Number(e.target.value)), children: [_jsx("option", { value: "", disabled: true, children: "\u2014 Choose recipient \u2014" }), recipients.map((r) => (_jsxs("option", { value: r.id, children: [r.firstName, " ", r.lastName] }, r.id)))] })), recipients.length === 0 && (_jsx("p", { className: styles.empty, children: "No one to message yet." })), recipients.length > 0 && (_jsxs("div", { className: styles.row, children: [_jsx("input", { className: styles.input, placeholder: "Write a message...", value: content, onChange: (e) => setContent(e.target.value), required: true }), _jsx("button", { className: styles.btn, type: "submit", disabled: !recipientId, children: "Send" })] })), error && _jsx("p", { className: styles.error, children: error })] }))] }));
}
