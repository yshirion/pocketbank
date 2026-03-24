import { useAuth } from '../context/AuthContext';
import { logout } from '../services/api';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import ActionList from '../components/ActionList';
import LoanPanel from '../components/LoanPanel';
import InvestPanel from '../components/InvestPanel';
import MessagePanel from '../components/MessagePanel';
import styles from './Dashboard.module.css';

export default function ChildDashboard() {
  const { user, viewingChild, setUser, setViewingChild } = useAuth();
  const navigate = useNavigate();

  const child = viewingChild ?? user!;
  const isParentViewing = viewingChild !== null;

  async function handleLogout() {
    await logout();
    setUser(null);
    setViewingChild(null);
    navigate('/login');
  }

  function handleBack() {
    setViewingChild(null);
    navigate('/parent');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>PocketBank</span>
        <div className={styles.headerActions}>
          {isParentViewing
            ? <button className={styles.logoutBtn} onClick={handleBack}>← Back to family</button>
            : <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          }
        </div>
      </header>

      <main className={styles.main}>
        <BalanceCard balance={child.balance} name={`${child.firstName} ${child.lastName}`} />
        <LoanPanel userId={child.id} readOnly={isParentViewing} />
        <InvestPanel userId={child.id} readOnly={isParentViewing} />
        <MessagePanel userId={child.id} familyId={child.familyId} isParent={false} readOnly={isParentViewing} />
        <ActionList userId={child.id} />
      </main>
    </div>
  );
}
