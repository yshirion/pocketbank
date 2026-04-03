import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useEffect, useState, useRef } from 'react';
import { getFamilyChildren, getFamilyParents, getConversation, getChildThread, getUnreadCounts, sendMessage as sendMsg, markRead, } from '../services/api';
import styles from './MessagingHub.module.css';
const IL_LOCALE = 'he-IL';
const IL_TZ = 'Asia/Jerusalem';
function msgDay(dateStr) {
    return new Date(dateStr).toLocaleDateString(IL_LOCALE, {
        timeZone: IL_TZ,
        day: 'numeric',
        month: 'long',
    });
}
function msgTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString(IL_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: IL_TZ,
    });
}
export default function MessagingHub({ userId, familyId, isParent, preSelectedId, onUnreadChange, }) {
    const [contacts, setContacts] = useState([]);
    const [selectedId, setSelectedId] = useState(preSelectedId ?? null);
    const [conversation, setConversation] = useState([]);
    const [draft, setDraft] = useState('');
    const bottomRef = useRef(null);
    async function loadUnread() {
        const res = await getUnreadCounts();
        const counts = res.data;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        onUnreadChange?.(total);
    }
    async function loadConversation(otherId) {
        // If parent is viewing a specific child, load the full child thread (all parents visible)
        const res = preSelectedId
            ? await getChildThread(otherId)
            : await getConversation(otherId);
        const msgs = res.data;
        setConversation(msgs);
        const unreadIds = msgs
            .filter((m) => m.senderId !== userId && !m.isRead)
            .map((m) => m.id);
        if (unreadIds.length > 0) {
            await markRead(unreadIds);
            await loadUnread();
        }
    }
    async function loadChildThread() {
        const res = await getChildThread(userId);
        const msgs = res.data;
        setConversation(msgs);
        const unreadIds = msgs.filter((m) => m.senderId !== userId && !m.isRead).map((m) => m.id);
        if (unreadIds.length > 0) {
            await markRead(unreadIds);
            await loadUnread();
        }
    }
    useEffect(() => {
        const fetcher = isParent ? getFamilyChildren : getFamilyParents;
        fetcher(familyId).then((res) => {
            const list = res.data;
            setContacts(list);
            if (isParent) {
                if (!preSelectedId && list.length > 0)
                    setSelectedId(list[0].id);
            }
            else {
                loadChildThread();
            }
        });
        loadUnread();
    }, [userId, familyId]);
    useEffect(() => {
        if (isParent && selectedId !== null)
            loadConversation(selectedId);
    }, [selectedId]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);
    async function handleSend(e) {
        e.preventDefault();
        if (!draft.trim())
            return;
        if (isParent) {
            if (!selectedId)
                return;
            await sendMsg({ receiverId: selectedId, content: draft.trim() });
            setDraft('');
            await loadConversation(selectedId);
        }
        else {
            if (contacts.length === 0)
                return;
            await sendMsg({ receiverId: contacts[0].id, content: draft.trim() });
            setDraft('');
            await loadChildThread();
        }
    }
    const selectedContact = contacts.find((c) => c.id === selectedId);
    return (_jsx("div", { className: styles.hub, children: _jsxs("div", { className: styles.chat, children: [_jsx("div", { className: styles.chatTitle, children: "Messages" }), (selectedContact || !isParent) ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.messages, children: [conversation.length === 0 && (_jsx("p", { className: styles.empty, children: "No messages yet. Say hello!" })), conversation.map((m, i) => {
                                    const isMine = (isParent && preSelectedId)
                                        ? m.senderId !== preSelectedId // parent view: anything not from the child = "mine"
                                        : m.senderId === userId;
                                    const isUnread = !isMine && !m.isRead;
                                    const day = msgDay(m.createdAt);
                                    const prevDay = i > 0 ? msgDay(conversation[i - 1].createdAt) : null;
                                    return (_jsxs(Fragment, { children: [day !== prevDay && (_jsx("div", { className: styles.dateSeparator, children: day })), _jsx("div", { className: isMine ? styles.rowMine : styles.rowTheirs, children: _jsxs("div", { className: [
                                                        styles.bubble,
                                                        isMine ? styles.bubbleMine : styles.bubbleTheirs,
                                                        isUnread ? styles.unread : '',
                                                    ].join(' '), children: [!isMine && !isParent && (_jsx("span", { className: styles.senderName, children: m.senderName })), _jsx("span", { className: styles.bubbleText, children: m.content }), _jsx("span", { className: styles.bubbleTime, children: msgTime(m.createdAt) })] }) })] }, m.id));
                                }), _jsx("div", { ref: bottomRef })] }), _jsxs("form", { onSubmit: handleSend, className: styles.inputRow, children: [_jsx("input", { className: styles.input, placeholder: "Write a message...", value: draft, onChange: (e) => setDraft(e.target.value) }), _jsx("button", { className: styles.sendBtn, type: "submit", disabled: !draft.trim(), children: "Send" })] })] })) : (_jsx("div", { className: styles.noChat, children: "Select a contact to start chatting." }))] }) }));
}
