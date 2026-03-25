import { useEffect, useState, FormEvent } from 'react';
import { getInbox, getSent, sendMessage, markRead, getFamilyChildren, getFamilyParents } from '../services/api';
import styles from './Panel.module.css';

interface Message {
  id: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Recipient {
  id: number;
  firstName: string;
  lastName: string;
}

export default function MessagePanel({
  userId,
  familyId,
  isParent,
  readOnly = false,
}: {
  userId: number;
  familyId: number;
  isParent: boolean;
  readOnly?: boolean;
}) {
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const [inRes, outRes] = await Promise.all([getInbox(userId), getSent(userId)]);
    const inboxMessages = inRes.data as Message[];
    setInbox(inboxMessages);
    setSent(outRes.data as Message[]);
    const unread = inboxMessages.filter((m) => !m.isRead).map((m) => m.id);
    if (unread.length > 0) await markRead(unread);
  }

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    if (readOnly) return;
    const fetcher = isParent ? getFamilyChildren : getFamilyParents;
    fetcher(familyId).then((r) => {
      const list = r.data as Recipient[];
      setRecipients(list);
      setRecipientId(null);
    });
  }, [familyId, isParent, readOnly]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!recipientId) { setError('No recipient available.'); return; }
    try {
      await sendMessage({ receiverId: recipientId, content });
      setContent('');
      await load();
    } catch {
      setError('Failed to send message.');
    }
  }

  const messages = tab === 'inbox' ? inbox : sent;
  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Messages</h2>
      <div className={styles.row}>
        <button className={tab === 'inbox' ? styles.btn : styles.btnDanger} onClick={() => setTab('inbox')}>
          Inbox{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
        <button className={tab === 'sent' ? styles.btn : styles.btnDanger} onClick={() => setTab('sent')}>Sent</button>
      </div>
      {messages.length === 0 && <p className={styles.empty}>No messages.</p>}
      <ul className={styles.list}>
        {messages.map((m) => (
          <li key={m.id} className={styles.item} style={{ fontWeight: tab === 'inbox' && !m.isRead ? 700 : 400 }}>
            <span className={styles.type}>{tab === 'inbox' ? m.senderName : 'You'}</span>
            <span style={{ flex: 2 }}>{m.content}</span>
            <span className={styles.date}>{new Date(m.createdAt).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form onSubmit={handleSend} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recipients.length > 0 && (
            <select
              className={styles.input}
              value={recipientId ?? ''}
              onChange={(e) => setRecipientId(Number(e.target.value))}
            >
              <option value="" disabled>— Choose recipient —</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
              ))}
            </select>
          )}
          {recipients.length === 0 && (
            <p className={styles.empty}>No one to message yet.</p>
          )}
          {recipients.length > 0 && (
            <div className={styles.row}>
              <input className={styles.input} placeholder="Write a message..." value={content} onChange={(e) => setContent(e.target.value)} required />
              <button className={styles.btn} type="submit" disabled={!recipientId}>Send</button>
            </div>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </form>
      )}
    </div>
  );
}
