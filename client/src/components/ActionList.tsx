import { useEffect, useState } from 'react';
import { getActions } from '../services/api';
import styles from './Panel.module.css';

interface Action {
  id: number;
  type: string;
  amount: number;
  positive: boolean;
  start: string;
}

export default function ActionList({ userId }: { userId: number }) {
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    getActions(userId).then((r) => setActions(r.data as Action[]));
  }, [userId]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Transaction History</h2>
      {actions.length === 0 && <p className={styles.empty}>No transactions yet.</p>}
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
    </div>
  );
}
