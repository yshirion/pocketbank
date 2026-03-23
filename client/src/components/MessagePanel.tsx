import { useEffect, useState, FormEvent } from 'react';
import { getInbox, getSent, sendMessage, markRead } from '../services/api';
import styles from './Panel.module.css';

interface Message {
  id: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagePanel({ userId, receiverId }: { userId: number; receiverId: number }) {
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [inRes, outRes] = await Promise.all([getInbox(userId), getSent(userId)]);
    const inboxMessages = inRes.data as Message[];
    setInbox(inboxMessages);
    setSent(outRes.data as Message[]);
    const unread = inboxMessages.filter((m) => !m.isRead).map((m) => m.id);
    if (unread.length > 0) await markRead(unread);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await sendMessage({ receiverId, content });
      setContent('');
      await load();
    } catch {
      setError('Failed to send message.');
    }
  }

  const messages = tab === 'inbox' ? inbox : sent;

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Messages</h2>
      <div className={styles.row}>
        <button className={tab === 'inbox' ? styles.btn : styles.btnDanger} onClick={() => setTab('inbox')}>
          Inbox {inbox.filter((m) => !m.isRead).length > 0 && `(${inbox.filter((m) => !m.isRead).length})`}
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
      <form onSubmit={handleSend} className={styles.row} style={{ marginTop: '1rem' }}>
        <input className={styles.input} placeholder="Write a message..." value={content} onChange={(e) => setContent(e.target.value)} required />
        <button className={styles.btn} type="submit">Send</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
