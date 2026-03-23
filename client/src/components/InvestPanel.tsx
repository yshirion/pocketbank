import { useEffect, useState, FormEvent } from 'react';
import { getInvests, createInvest, withdrawInvests } from '../services/api';
import styles from './Panel.module.css';

interface Invest {
  id: number;
  amount: number;
  currentAmount: number;
  interest: number;
  longTerm: boolean;
  start: string;
  end: string;
}

export default function InvestPanel({ userId, readOnly }: { userId: number; readOnly?: boolean }) {
  const [invests, setInvests] = useState<Invest[]>([]);
  const [amount, setAmount] = useState('');
  const [longTerm, setLongTerm] = useState(false);
  const [end, setEnd] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const r = await getInvests(userId);
    setInvests(r.data as Invest[]);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createInvest({ userId, amount: Number(amount), longTerm, end });
      setAmount('');
      setEnd('');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to create investment.');
    }
  }

  async function handleWithdraw() {
    setError('');
    try {
      await withdrawInvests(selected);
      setSelected([]);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to withdraw.');
    }
  }

  function toggle(id: number) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Investments</h2>
      {!readOnly && (
        <form onSubmit={handleCreate} className={styles.row}>
          <input className={styles.input} type="number" min="1" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input className={styles.input} type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={longTerm} onChange={(e) => setLongTerm(e.target.checked)} />
            Long-term
          </label>
          <button className={styles.btn} type="submit">Invest</button>
        </form>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {invests.length === 0 && <p className={styles.empty}>No active investments.</p>}
      <ul className={styles.list}>
        {invests.map((inv) => (
          <li key={inv.id} className={styles.item}>
            {!readOnly && (
              <input className={styles.checkbox} type="checkbox" checked={selected.includes(inv.id)} onChange={() => toggle(inv.id)} />
            )}
            <span className={styles.type}>{inv.longTerm ? 'Long-term' : 'Short-term'}</span>
            <span className={styles.tag}>{inv.interest}%/mo</span>
            <span className={styles.positive}>₪{inv.currentAmount.toFixed(2)}</span>
            <span className={styles.date}>until {new Date(inv.end).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
      {!readOnly && selected.length > 0 && (
        <button className={styles.btn} onClick={handleWithdraw}>Withdraw Selected</button>
      )}
    </div>
  );
}
