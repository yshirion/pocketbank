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

interface Props {
  userId: number;
  isParent?: boolean;
  onAction?: () => void;
}

export default function InvestPanel({ userId, isParent, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [invests, setInvests] = useState<Invest[]>([]);
  const [amount, setAmount] = useState('');
  const [longTerm, setLongTerm] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const r = await getInvests(userId);
    setInvests(r.data as Invest[]);
  }

  useEffect(() => {
    load();
    setOpen(false);
  }, [userId]);

  const total = invests.reduce((s, i) => s + i.currentAmount, 0);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createInvest({ userId, amount: Number(amount), longTerm });
      setAmount('');
      setLongTerm(false);
      await load();
      onAction?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to invest.');
    }
  }

  async function handleRelease(id: number) {
    setError('');
    try {
      await withdrawInvests([id]);
      await load();
      onAction?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to release.');
    }
  }

  return (
    <div className={styles.expandCard}>
      <button className={styles.expandHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.expandTitle}>Investments</span>
        <div className={styles.expandRight}>
          <span className={invests.length === 0 ? styles.expandTotal : styles.expandTotalPos}>
            {invests.length === 0 ? 'None' : `₪${total.toFixed(2)}`}
          </span>
          <span className={open ? styles.chevronOpen : styles.chevron}>▼</span>
        </div>
      </button>
      {open && (
        <div className={styles.expandBody}>
          {!isParent && (
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
              <div className={styles.termToggle}>
                <button
                  type="button"
                  className={!longTerm ? styles.termOptionActive : styles.termOption}
                  onClick={() => setLongTerm(false)}
                >
                  Short · 1 mo
                </button>
                <button
                  type="button"
                  className={longTerm ? styles.termOptionActive : styles.termOption}
                  onClick={() => setLongTerm(true)}
                >
                  Long · 6 mo
                </button>
              </div>
              <button className={styles.btn} type="submit">Invest</button>
            </form>
          )}
          {error && <p className={styles.error}>{error}</p>}
          {invests.length === 0
            ? <p className={styles.empty}>No active investments.</p>
            : (
              <ul className={styles.list}>
                {invests.map((inv) => {
                  const matured = new Date() >= new Date(inv.end);
                  return (
                    <li key={inv.id} className={styles.item}>
                      <span className={styles.type}>{inv.longTerm ? 'Long-term' : 'Short-term'}</span>
                      <span className={styles.tag}>{inv.interest}%/mo</span>
                      <span className={styles.positive}>₪{inv.currentAmount.toFixed(2)}</span>
                      {matured
                        ? isParent && (
                          <button className={styles.btnSmall} onClick={() => handleRelease(inv.id)}>
                            Release
                          </button>
                        )
                        : <span className={styles.date}>from {new Date(inv.end).toLocaleDateString()}</span>
                      }
                    </li>
                  );
                })}
              </ul>
            )
          }
        </div>
      )}
    </div>
  );
}
