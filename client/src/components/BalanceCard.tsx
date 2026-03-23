import styles from './BalanceCard.module.css';

interface Props {
  balance: number;
  name: string;
}

export default function BalanceCard({ balance, name }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.name}>{name}</p>
      <p className={styles.label}>Balance</p>
      <p className={styles.amount}>₪{balance.toFixed(2)}</p>
    </div>
  );
}
