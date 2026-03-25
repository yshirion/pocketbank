import { useState, useEffect } from 'react';
import { getActions } from '../services/api';
import styles from './BalanceCard.module.css';

interface Action {
  id: number;
  type: string;
  amount: number;
  positive: boolean;
  start: string;
}

interface Props {
  userId: number;
  balance: number;
  name: string;
}

export default function BalanceCard({ userId, balance, name }: Props) {
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setActions([]);
    setOpen(false);
  }, [userId]);

  useEffect(() => {
    if (open && !loaded) {
      getActions(userId).then((r) => {
        setActions(r.data as Action[]);
        setLoaded(true);
      });
    }
  }, [open, userId, loaded]);

  return (
    <div className={styles.card}>
      <button className={styles.header} onClick={() => setOpen((o) => !o)}>
        <p className={styles.name}>{name}</p>
        <p className={styles.label}>Balance</p>
        <p className={styles.amount}>₪{balance.toFixed(2)}</p>
        <span className={open ? styles.chevronOpen : styles.chevron}>▼</span>
      </button>
      {open && (
        <div className={styles.body}>
          {actions.length === 0
            ? <p className={styles.empty}>No transactions yet.</p>
            : (
              <ul className={styles.list}>
                {actions.map((a) => (
                  <li key={a.id} className={styles.item}>
                    <span className={styles.type}>{a.type}</span>
                    <span className={a.positive ? styles.positive : styles.negative}>
                      {a.positive ? '+' : '-'}₪{a.amount.toFixed(2)}
                    </span>
                    <span className={styles.date}>{new Date(a.start).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      )}
    </div>
  );
}
