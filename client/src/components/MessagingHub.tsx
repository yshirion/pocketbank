import { Fragment, useEffect, useState, useRef, FormEvent } from 'react';
import {
  getFamilyChildren, getFamilyParents,
  getConversation, getUnreadCounts,
  sendMessage as sendMsg, markRead,
} from '../services/api';
import styles from './MessagingHub.module.css';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const IL_LOCALE = 'he-IL';
const IL_TZ = 'Asia/Jerusalem';

function msgDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(IL_LOCALE, {
    timeZone: IL_TZ,
    day: 'numeric',
    month: 'long',
  });
}

function msgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(IL_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IL_TZ,
  });
}

export default function MessagingHub({
  userId,
  familyId,
  isParent,
  onUnreadChange,
}: {
  userId: number;
  familyId: number;
  isParent: boolean;
  onUnreadChange?: (count: number) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadUnread() {
    const res = await getUnreadCounts();
    const counts = res.data as Record<number, number>;
    setUnreadCounts(counts);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    onUnreadChange?.(total);
  }

  async function loadConversation(otherId: number) {
    const res = await getConversation(otherId);
    const msgs = res.data as Message[];
    setConversation(msgs);
    const unreadIds = msgs
      .filter((m) => m.senderId === otherId && !m.isRead)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await markRead(unreadIds);
      await loadUnread();
    }
  }

  useEffect(() => {
    const fetcher = isParent ? getFamilyChildren : getFamilyParents;
    fetcher(familyId).then((res) => {
      const list = res.data as Contact[];
      setContacts(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
    loadUnread();
  }, [userId, familyId]);

  useEffect(() => {
    if (selectedId !== null) loadConversation(selectedId);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    await sendMsg({ receiverId: selectedId, content: draft.trim() });
    setDraft('');
    await loadConversation(selectedId);
  }

  const selectedContact = contacts.find((c) => c.id === selectedId);

  return (
    <div className={styles.hub}>
      {/* Left: contact list */}
      <div className={styles.contacts}>
        <div className={styles.contactsTitle}>Messages</div>
        {contacts.length === 0 && <p className={styles.empty}>No contacts yet.</p>}
        {contacts.map((c) => (
          <button
            key={c.id}
            className={`${styles.contact} ${selectedId === c.id ? styles.contactActive : ''}`}
            onClick={() => setSelectedId(c.id)}
          >
            <span className={styles.contactName}>{c.firstName} {c.lastName}</span>
            {(unreadCounts[c.id] ?? 0) > 0 && (
              <span className={styles.badge}>{unreadCounts[c.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Right: chat */}
      <div className={styles.chat}>
        {selectedContact ? (
          <>
            <div className={styles.messages}>
              {conversation.length === 0 && (
                <p className={styles.empty}>No messages yet. Say hello!</p>
              )}
              {conversation.map((m, i) => {
                const isMine = m.senderId === userId;
                const isUnread = !isMine && !m.isRead;
                const day = msgDay(m.createdAt);
                const prevDay = i > 0 ? msgDay(conversation[i - 1].createdAt) : null;
                return (
                  <Fragment key={m.id}>
                    {day !== prevDay && (
                      <div className={styles.dateSeparator}>{day}</div>
                    )}
                    <div className={isMine ? styles.rowMine : styles.rowTheirs}>
                      <div className={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleTheirs,
                        isUnread ? styles.unread : '',
                      ].join(' ')}>
                        <span className={styles.bubbleText}>{m.content}</span>
                        <span className={styles.bubbleTime}>{msgTime(m.createdAt)}</span>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder="Write a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className={styles.sendBtn} type="submit" disabled={!draft.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className={styles.noChat}>Select a contact to start chatting.</div>
        )}
      </div>
    </div>
  );
}
