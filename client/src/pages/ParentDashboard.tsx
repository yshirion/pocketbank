import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import {
  getFamilyChildren, getFamily, updateInterests, logout, createAction,
  confirmChild, promoteToParent, deleteUser,
  listMissions, createMission, approveMission, deactivateMission,
  getMissionNotifications,
} from '../services/api';
import styles from './Dashboard.module.css';
import logoImg from '../assets/logo.png';

interface Family {
  id: number;
  name: string;
  loanInterest: number;
  investLongInterest: number;
  investShortInterest: number;
}

interface MissionCompletion {
  id:          number;
  userId:      number;
  completedAt: string;
  approvedAt:  string | null;
  user:        { id: number; firstName: string; lastName: string };
}

interface Mission {
  id:          number;
  title:       string;
  description: string | null;
  reward:      number;
  isRepeat:    boolean;
  repeatEvery: number | null;
  repeatUnit:  string | null;
  expiresAt:   string | null;
  isActive:    boolean;
  assignee:    { id: number; firstName: string; lastName: string } | null;
  completions: MissionCompletion[];
}

const defaultMissionForm = {
  title:       '',
  description: '',
  reward:      '',
  assignedTo:  '' as string,
  isRepeat:    false,
  repeatEvery: '1',
  repeatUnit:  'week',
  expiresAt:   '',
};

export default function ParentDashboard() {
  const { user, setUser, setViewingChild } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [editingInterests, setEditingInterests] = useState(false);
  const [interests, setInterests] = useState({ loanInterest: 0, investLongInterest: 0, investShortInterest: 0 });
  const [addMoneyChildId, setAddMoneyChildId] = useState<number | null>(null);
  const [moneyForm, setMoneyForm] = useState({ amount: '', type: '', positive: true });

  const [missions,          setMissions         ] = useState<Mission[]>( [] );
  const [missionOpen,       setMissionOpen      ] = useState( true );
  const [showCreateMission, setShowCreateMission] = useState( false );
  const [missionForm,       setMissionForm      ] = useState( defaultMissionForm );
  const [missionError,      setMissionError     ] = useState( '' );
  const [pendingApprovals,  setPendingApprovals ] = useState( 0 );

  const loadMissions = useCallback( async () =>
  {
    const [mRes, nRes] = await Promise.all( [
      listMissions(),
      getMissionNotifications(),
    ] );
    setMissions( mRes.data as Mission[] );
    setPendingApprovals( ( nRes.data as { pendingApprovals: number } ).pendingApprovals );
  }, [] );

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

  useEffect( () =>
  {
    load();
    loadMissions();
    const interval = setInterval( loadMissions, 30_000 );
    return () => clearInterval( interval );
  }, [] );

  function viewChild(child: User) {
    setViewingChild(child);
    navigate('/child');
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

  async function handleConfirm(childId: number) {
    await confirmChild(childId);
    await load();
  }

  async function handleDeny(child: User) {
    if (!confirm(`Deny ${child.firstName}? This will delete their account.`)) return;
    await deleteUser(child.id);
    await load();
  }

  async function handlePromotePending(child: User) {
    if (!confirm(`Make ${child.firstName} a parent? Their account will be confirmed and promoted.`)) return;
    await confirmChild(child.id);
    await promoteToParent(child.id);
    await load();
  }

  async function handleCreateMission() {
    setMissionError( '' );
    const reward = parseFloat( missionForm.reward );
    if( !missionForm.title.trim() || !reward || reward <= 0 )
    {
      setMissionError( 'Title and a positive reward are required.' );
      return;
    }
    if( missionForm.isRepeat && ( !missionForm.repeatEvery || !missionForm.repeatUnit ) )
    {
      setMissionError( 'Repeat interval is required for repeating missions.' );
      return;
    }
    await createMission({
      title:       missionForm.title.trim(),
      description: missionForm.description.trim() || undefined,
      reward,
      assignedTo:  missionForm.assignedTo ? Number( missionForm.assignedTo ) : undefined,
      isRepeat:    missionForm.isRepeat,
      repeatEvery: missionForm.isRepeat ? Number( missionForm.repeatEvery ) : undefined,
      repeatUnit:  missionForm.isRepeat ? missionForm.repeatUnit : undefined,
      expiresAt:   missionForm.expiresAt || undefined,
    });
    setMissionForm( defaultMissionForm );
    setShowCreateMission( false );
    await loadMissions();
  }

  async function handleApproveMission( completionId: number ) {
    await approveMission( completionId );
    await loadMissions();
  }

  async function handleDeactivateMission( missionId: number ) {
    if( !confirm( 'Deactivate this mission? Children will no longer see it.' ) ) return;
    await deactivateMission( missionId );
    await loadMissions();
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <img src={logoImg} alt="" className={styles.logoImg} />
          <span className={styles.logoText}>PocketBank</span>
        </div>
        <span className={styles.headerName}>Hi, {user?.firstName} {user?.lastName} (Family ID: {user?.familyId})</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          {children.filter(c => !c.isConfirmed).map((child) => (
            <div key={child.id} className={styles.pendingCard}>
              <div className={styles.pendingInfo}>
                <span className={styles.pendingName}>{child.firstName} {child.lastName}</span>
                <span className={styles.pendingLabel}>Waiting for approval</span>
              </div>
              <div className={styles.pendingActions}>
                <button className={styles.confirmBtn} onClick={() => handleConfirm(child.id)}>Confirm</button>
                <button className={styles.deleteBtn} onClick={() => handleDeny(child)}>Deny</button>
                <button className={styles.promoteBtn} onClick={() => handlePromotePending(child)}>Make Parent</button>
              </div>
            </div>
          ))}
          {children.filter(c => c.isConfirmed).length === 0 && children.filter(c => !c.isConfirmed).length === 0 && (
            <p className={styles.empty}>No children yet. Share your Family ID with them.</p>
          )}
          {children.filter(c => c.isConfirmed).map((child) => (
            <div key={child.id} className={styles.childCard}>
              <div className={styles.childCardNav} onClick={() => viewChild(child)}>
                <span className={styles.childCardName}>{child.firstName} {child.lastName}</span>
                <span className={styles.childCardBalance}>₪{child.balance.toFixed(2)}</span>
              </div>
              <div className={styles.childCardFooter}>
                <button
                  className={styles.addMoneyBtn}
                  onClick={() => {
                    setAddMoneyChildId(addMoneyChildId === child.id ? null : child.id);
                    setMoneyForm({ amount: '', type: '', positive: true });
                  }}
                >
                  {addMoneyChildId === child.id ? 'Cancel' : '+ Add Money'}
                </button>
              </div>
              {addMoneyChildId === child.id && (
                <div className={styles.moneyForm}>
                  <div className={styles.moneyToggle}>
                    <button className={moneyForm.positive ? styles.activePos : styles.editBtn} onClick={() => setMoneyForm((f) => ({ ...f, positive: true }))}>+ Income</button>
                    <button className={!moneyForm.positive ? styles.activeNeg : styles.deleteBtn} onClick={() => setMoneyForm((f) => ({ ...f, positive: false }))}>− Expense</button>
                  </div>
                  <input className={styles.moneyInput} type="number" min="0" step="0.01" placeholder="Amount (₪)" value={moneyForm.amount} onChange={(e) => setMoneyForm((f) => ({ ...f, amount: e.target.value }))} />
                  <input className={styles.moneyInput} type="text" placeholder="Description (e.g. Allowance)" value={moneyForm.type} onChange={(e) => setMoneyForm((f) => ({ ...f, type: e.target.value }))} />
                  <button className={styles.editBtn} onClick={() => handleAddMoney(child.id)}>Save</button>
                </div>
              )}
            </div>
          ))}
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

        <div className={styles.card}>
          <button
            style={{ display: 'flex', width: '100%', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: missionOpen ? '1rem' : 0 }}
            onClick={() => setMissionOpen( o => !o )}
          >
            <h2 className={styles.sectionTitle} style={{ margin: 0, flex: 1, textAlign: 'left' }}>Missions</h2>
            {pendingApprovals > 0 && (
              <span style={{ background: '#fed7d7', color: '#c53030', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', marginRight: '0.5rem' }}>
                {pendingApprovals} pending
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{missionOpen ? '▲' : '▼'}</span>
          </button>

          {missionOpen && (
            <>
              <button className={styles.addMoneyBtn} onClick={() => { setShowCreateMission( s => !s ); setMissionError( '' ); }}>
                {showCreateMission ? 'Cancel' : '+ New Mission'}
              </button>

              {showCreateMission && (
                <div className={styles.moneyForm} style={{ marginTop: '0.75rem' }}>
                  {missionError && <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: 0 }}>{missionError}</p>}
                  <input className={styles.moneyInput} placeholder="Title *" value={missionForm.title} onChange={e => setMissionForm( f => ({ ...f, title: e.target.value }) )} />
                  <input className={styles.moneyInput} placeholder="Description (optional)" value={missionForm.description} onChange={e => setMissionForm( f => ({ ...f, description: e.target.value }) )} />
                  <input className={styles.moneyInput} type="number" min="0" step="0.01" placeholder="Reward ₪ *" value={missionForm.reward} onChange={e => setMissionForm( f => ({ ...f, reward: e.target.value }) )} />

                  <select className={styles.moneyInput} value={missionForm.assignedTo} onChange={e => setMissionForm( f => ({ ...f, assignedTo: e.target.value }) )}>
                    <option value="">All children</option>
                    {children.filter( c => c.isConfirmed ).map( c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ) )}
                  </select>

                  <div className={styles.moneyToggle}>
                    <button className={!missionForm.isRepeat ? styles.activePos : styles.editBtn} onClick={() => setMissionForm( f => ({ ...f, isRepeat: false }) )}>One-time</button>
                    <button className={missionForm.isRepeat ? styles.activePos : styles.editBtn} onClick={() => setMissionForm( f => ({ ...f, isRepeat: true }) )}>Repeating</button>
                  </div>

                  {missionForm.isRepeat && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className={styles.moneyInput} type="number" min="1" style={{ width: '70px', flex: 'none' }} value={missionForm.repeatEvery} onChange={e => setMissionForm( f => ({ ...f, repeatEvery: e.target.value }) )} />
                      <select className={styles.moneyInput} value={missionForm.repeatUnit} onChange={e => setMissionForm( f => ({ ...f, repeatUnit: e.target.value }) )}>
                        <option value="day">Day(s)</option>
                        <option value="week">Week(s)</option>
                        <option value="month">Month(s)</option>
                      </select>
                    </div>
                  )}

                  <label style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                    Deadline (optional)
                    <input className={styles.moneyInput} type="datetime-local" style={{ marginTop: '0.2rem' }} value={missionForm.expiresAt} onChange={e => setMissionForm( f => ({ ...f, expiresAt: e.target.value }) )} />
                  </label>

                  <button className={styles.editBtn} onClick={handleCreateMission}>Create Mission</button>
                </div>
              )}

              {missions.filter( m => m.isActive ).length === 0 && !showCreateMission && (
                <p className={styles.empty} style={{ marginTop: '0.75rem' }}>No missions yet.</p>
              )}

              {missions.map( ( m ) =>
              {
                const pending = m.completions.filter( c => c.approvedAt === null );
                return (
                  <div key={m.id} style={{ marginTop: '0.75rem', background: m.isActive ? '#f7fafc' : '#f9f9f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, flex: 1, color: m.isActive ? '#2d3748' : '#a0aec0' }}>{m.title}</span>
                      <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.9rem' }}>+₪{m.reward.toFixed( 2 )}</span>
                      {m.isActive && (
                        <button className={styles.deleteBtn} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeactivateMission( m.id )}>Stop</button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      {m.assignee
                        ? <span style={{ fontSize: '0.75rem', background: '#ebf8ff', color: '#2b6cb0', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>{m.assignee.firstName}</span>
                        : <span style={{ fontSize: '0.75rem', background: '#ebf8ff', color: '#2b6cb0', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>All children</span>
                      }
                      {m.isRepeat
                        ? <span style={{ fontSize: '0.75rem', background: '#fefcbf', color: '#744210', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>Every {m.repeatEvery} {m.repeatUnit}</span>
                        : <span style={{ fontSize: '0.75rem', background: '#fefcbf', color: '#744210', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>One-time</span>
                      }
                      {!m.isActive && <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#718096', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>Inactive</span>}
                    </div>

                    {pending.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {pending.map( ( c ) => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ flex: 1, color: '#4a5568' }}>
                              {c.user.firstName} {c.user.lastName} — {new Date( c.completedAt ).toLocaleString()}
                            </span>
                            <button className={styles.confirmBtn} style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleApproveMission( c.id )}>
                              Approve
                            </button>
                          </div>
                        ) )}
                      </div>
                    )}
                  </div>
                );
              } )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
