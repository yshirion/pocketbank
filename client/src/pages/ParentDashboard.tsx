import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import { getFamilyChildren, getFamily, updateInterests, promoteToParent, deleteUser, logout, createAction } from '../services/api';
import MessagePanel from '../components/MessagePanel';
import styles from './Dashboard.module.css';

interface Family {
  id: number;
  name: string;
  loanInterest: number;
  investLongInterest: number;
  investShortInterest: number;
}

export default function ParentDashboard() {
  const { user, setUser, setViewingChild } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [editingInterests, setEditingInterests] = useState(false);
  const [interests, setInterests] = useState({ loanInterest: 0, investLongInterest: 0, investShortInterest: 0 });
  const [addMoneyChildId, setAddMoneyChildId] = useState<number | null>(null);
  const [moneyForm, setMoneyForm] = useState({ amount: '', type: '', positive: true });

  async function load() {
    const [childRes, familyRes] = await Promise.all([
      getFamilyChildren(user!.familyId),
      getFamily(user!.familyId),
    ]);
    setChildren(childRes.data as User[]);
    const f = familyRes.data as Family;
    setFamily(f);
    setInterests({ loanInterest: f.loanInterest, investLongInterest: f.investLongInterest, investShortInterest: f.investShortInterest });
  }

  useEffect(() => { load(); }, []);

  function viewChild(child: User) {
    setViewingChild(child);
    navigate('/child');
  }

  async function handlePromote(id: number) {
    await promoteToParent(id);
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this child?')) return;
    await deleteUser(id);
    await load();
  }

  async function handleSaveInterests() {
    await updateInterests(user!.familyId, interests);
    setEditingInterests(false);
    await load();
  }

  async function handleAddMoney(childId: number) {
    const amount = parseFloat(moneyForm.amount);
    if (!amount || amount <= 0 || !moneyForm.type.trim()) return;
    await createAction({ userId: childId, positive: moneyForm.positive, type: moneyForm.type.trim(), amount });
    setAddMoneyChildId(null);
    setMoneyForm({ amount: '', type: '', positive: true });
    await load();
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>PocketBank</span>
        <span className={styles.subtitle}>Family: {family?.name} (ID: {user?.familyId})</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Children</h2>
          {children.length === 0 && <p className={styles.empty}>No children yet. Share your Family ID with them.</p>}
          <ul className={styles.childList}>
            {children.map((child) => (
              <li key={child.id} className={styles.childItem}>
                <div className={styles.childRow}>
                <button className={styles.childName} onClick={() => viewChild(child)}>
                  {child.firstName} {child.lastName}
                  <span className={styles.childBalance}>₪{child.balance.toFixed(2)}</span>
                </button>
                <div className={styles.childActions}>
                  <button className={styles.editBtn} onClick={() => { setAddMoneyChildId(child.id); setMoneyForm({ amount: '', type: '', positive: true }); }}>Add Money</button>
                  <button className={styles.promoteBtn} onClick={() => handlePromote(child.id)}>Make Parent</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(child.id)}>Delete</button>
                </div>
                </div>
                {addMoneyChildId === child.id && (
                  <div className={styles.moneyForm}>
                    <div className={styles.moneyToggle}>
                      <button className={moneyForm.positive ? styles.activePos : styles.editBtn} onClick={() => setMoneyForm((f) => ({ ...f, positive: true }))}>+ Income</button>
                      <button className={!moneyForm.positive ? styles.activeNeg : styles.deleteBtn} onClick={() => setMoneyForm((f) => ({ ...f, positive: false }))}>− Expense</button>
                    </div>
                    <input className={styles.moneyInput} type="number" min="0" step="0.01" placeholder="Amount (₪)" value={moneyForm.amount} onChange={(e) => setMoneyForm((f) => ({ ...f, amount: e.target.value }))} />
                    <input className={styles.moneyInput} type="text" placeholder="Description (e.g. Allowance)" value={moneyForm.type} onChange={(e) => setMoneyForm((f) => ({ ...f, type: e.target.value }))} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className={styles.editBtn} onClick={() => handleAddMoney(child.id)}>Save</button>
                      <button className={styles.deleteBtn} onClick={() => setAddMoneyChildId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Interest Rates</h2>
          {!editingInterests ? (
            <div>
              <p>Loan: {family?.loanInterest}%/month</p>
              <p>Investment (short): {family?.investShortInterest}%/month</p>
              <p>Investment (long): {family?.investLongInterest}%/month</p>
              <button className={styles.editBtn} onClick={() => setEditingInterests(true)}>Edit</button>
            </div>
          ) : (
            <div className={styles.interestForm}>
              <label>Loan interest (%/month)
                <input type="number" step="0.01" value={interests.loanInterest} onChange={(e) => setInterests((i) => ({ ...i, loanInterest: Number(e.target.value) }))} />
              </label>
              <label>Short-term invest (%/month)
                <input type="number" step="0.01" value={interests.investShortInterest} onChange={(e) => setInterests((i) => ({ ...i, investShortInterest: Number(e.target.value) }))} />
              </label>
              <label>Long-term invest (%/month)
                <input type="number" step="0.01" value={interests.investLongInterest} onChange={(e) => setInterests((i) => ({ ...i, investLongInterest: Number(e.target.value) }))} />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={styles.editBtn} onClick={handleSaveInterests}>Save</button>
                <button className={styles.deleteBtn} onClick={() => setEditingInterests(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <MessagePanel userId={user!.id} receiverId={user!.id} />
      </main>
    </div>
  );
}
