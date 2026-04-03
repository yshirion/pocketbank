import { Fragment, useEffect, useState, useRef, FormEvent } from 'react';
import {
  getFamilyChildren, getFamilyParents,
  getConversation, getChildThread, getUnreadCounts,
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
  preSelectedId,
  onUnreadChange,
}: {
  userId: number;
  familyId: number;
  isParent: boolean;
  preSelectedId?: number;
  onUnreadChange?: (count: number) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(preSelectedId ?? null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadUnread() {
    const res = await getUnreadCounts();
    const counts = res.data as Record<number, number>;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    onUnreadChange?.(total);
  }

  async function loadConversation(otherId: number) {
    // If parent is viewing a specific child, load the full child thread (all parents visible)
    const res = preSelectedId
      ? await getChildThread(otherId)
      : await getConversation(otherId);
    const msgs = res.data as Message[];
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
    const msgs = res.data as Message[];
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
      const list = res.data as Contact[];
      setContacts(list);
      if (isParent) {
        if (!preSelectedId && list.length > 0) setSelectedId(list[0].id);
      } else {
        loadChildThread();
      }
    });
    loadUnread();
  }, [userId, familyId]);

  useEffect(() => {
    if (isParent && selectedId !== null) loadConversation(selectedId);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    if (isParent) {
      if (!selectedId) return;
      await sendMsg({ receiverId: selectedId, content: draft.trim() });
      setDraft('');
      await loadConversation(selectedId);
    } else {
      if (contacts.length === 0) return;
      await sendMsg({ receiverId: contacts[0].id, content: draft.trim() });
      setDraft('');
      await loadChildThread();
    }
  }

  const selectedContact = contacts.find((c) => c.id === selectedId);

  return (
    <div className={styles.hub}>
      <div className={styles.chat}>
        <div className={styles.chatTitle}>Messages</div>
        {(selectedContact || !isParent) ? (
          <>
            <div className={styles.messages}>
              {conversation.length === 0 && (
                <p className={styles.empty}>No messages yet. Say hello!</p>
              )}
              {conversation.map((m, i) => {
                const isMine = (isParent && preSelectedId)
                  ? m.senderId !== preSelectedId   // parent view: anything not from the child = "mine"
                  : m.senderId === userId;
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
                        {!isMine && !isParent && (
                          <span className={styles.senderName}>{m.senderName}</span>
                        )}
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
