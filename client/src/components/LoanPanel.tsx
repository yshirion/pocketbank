import { useEffect, useState, FormEvent } from 'react';
import { getLoans, createLoan, repayLoans } from '../services/api';
import styles from './Panel.module.css';

interface Loan {
  id: number;
  amount: number;
  currentAmount: number;
  interest: number;
  start: string;
}

interface Props {
  userId: number;
  isParent?: boolean;
  onAction?: () => void;
}

export default function LoanPanel({ userId, isParent, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const r = await getLoans(userId);
    setLoans(r.data as Loan[]);
  }

  useEffect(() => {
    load();
    setOpen(false);
    setSelected([]);
  }, [userId]);

  const total = loans.reduce((s, l) => s + l.currentAmount, 0);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createLoan({ userId, amount: Number(amount) });
      setAmount('');
      await load();
      onAction?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed.');
    }
  }

  async function handleRepay() {
    setError('');
    try {
      await repayLoans(selected);
      setSelected([]);
      await load();
      onAction?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to repay.');
    }
  }

  function toggle(id: number) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  return (
    <div className={styles.expandCard}>
      <button className={styles.expandHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.expandTitle}>Loans</span>
        <div className={styles.expandRight}>
          <span className={loans.length === 0 ? styles.expandTotal : styles.expandTotalNeg}>
            {loans.length === 0 ? 'None' : `₪${total.toFixed(2)}`}
          </span>
          <span className={open ? styles.chevronOpen : styles.chevron}>▼</span>
        </div>
      </button>
      {open && (
        <div className={styles.expandBody}>
          <form onSubmit={handleCreate} className={styles.row}>
            <input
              className={styles.input}
              type="number"
              min="1"
              placeholder="Amount (₪)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <button className={styles.btn} type="submit">
              {isParent ? 'Give Loan' : 'Request Loan'}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
          {loans.length === 0
            ? <p className={styles.empty}>No active loans.</p>
            : (
              <ul className={styles.list}>
                {loans.map((l) => (
                  <li key={l.id} className={styles.item}>
                    {!isParent && (
                      <input
                        className={styles.checkbox}
                        type="checkbox"
                        checked={selected.includes(l.id)}
                        onChange={() => toggle(l.id)}
                      />
                    )}
                    <span className={styles.type}>Loan</span>
                    <span className={styles.tag}>{l.interest}%/mo</span>
                    <span className={styles.negative}>₪{l.currentAmount.toFixed(2)}</span>
                    <span className={styles.date}>{new Date(l.start).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )
          }
          {!isParent && selected.length > 0 && (
            <button className={styles.btnDanger} style={{ marginTop: '0.5rem' }} onClick={handleRepay}>
              Repay Selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}
