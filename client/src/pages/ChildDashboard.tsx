import { useState } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { logout, getMe, getFamilyChildren, promoteToParent, deleteUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import LoanPanel from '../components/LoanPanel';
import InvestPanel from '../components/InvestPanel';
import MessagingHub from '../components/MessagingHub';
import styles from './Dashboard.module.css';
import logoImg from '../assets/logo.png';

export default function ChildDashboard() {
  const { user, viewingChild, setUser, setViewingChild } = useAuth();
  const navigate = useNavigate();
  const [totalUnread, setTotalUnread] = useState(0);

  const child = viewingChild ?? user!;
  const isParentViewing = viewingChild !== null;
  const [balance, setBalance] = useState(child.balance);

  async function refreshBalance() {
    if (!isParentViewing) {
      const res = await getMe();
      const fresh = res.data as User;
      setUser(fresh);
      setBalance(fresh.balance);
    } else {
      const res = await getFamilyChildren(user!.familyId);
      const fresh = (res.data as User[]).find((c) => c.id === child.id);
      if (fresh) setBalance(fresh.balance);
    }
  }

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

  async function handleRemove() {
    if (!confirm(`Delete ${child.firstName}? This cannot be undone.`)) return;
    await deleteUser(child.id);
    setViewingChild(null);
    navigate('/parent');
  }

  async function handlePromote() {
    if (!confirm(`Promote ${child.firstName} to parent? All their balance, loans, and investments will be deleted.`)) return;
    await promoteToParent(child.id);
    setViewingChild(null);
    navigate('/parent');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <img src={logoImg} alt="" className={styles.logoImg} />
          <span className={styles.logoText}>PocketBank</span>
        </div>
        <span className={styles.headerName}>{user?.firstName} {user?.lastName}</span>
        <div className={styles.headerActions}>
          {totalUnread > 0 && (
            <span className={styles.unreadBadge}>{totalUnread} new {totalUnread === 1 ? 'message' : 'messages'}</span>
          )}
          {isParentViewing
            ? <button className={styles.logoutBtn} onClick={handleBack}>← Back to family</button>
            : <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          }
        </div>
      </header>

      {isParentViewing && (
        <div className={styles.parentActionBar}>
          <button className={styles.dangerBtn} onClick={handleRemove}>Remove Child</button>
          <button className={styles.warnBtn} onClick={handlePromote}>Make Parent</button>
        </div>
      )}

      <div className={styles.childLayoutWithChat}>
        <div className={styles.childCards}>
          <div className={styles.childSectionName}>{child.firstName} {child.lastName}</div>
          <BalanceCard userId={child.id} balance={balance} />
          <LoanPanel userId={child.id} isParent={isParentViewing} onAction={refreshBalance} />
          <InvestPanel userId={child.id} isParent={isParentViewing} onAction={refreshBalance} />
        </div>
        <div className={styles.childSidebar}>
          {isParentViewing
            ? <MessagingHub userId={user!.id} familyId={user!.familyId} isParent={true} onUnreadChange={setTotalUnread} />
            : <MessagingHub userId={child.id} familyId={child.familyId} isParent={false} onUnreadChange={setTotalUnread} />
          }
        </div>
      </div>
    </div>
  );
}
