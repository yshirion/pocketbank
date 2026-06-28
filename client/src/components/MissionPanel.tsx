import { useEffect, useState, useCallback } from 'react';
import {
  listMissions,
  completeMission,
  getMissionNotifications,
  markMissionNotificationsSeen,
} from '../services/api';
import styles from './Panel.module.css';

interface MissionCompletion {
  id:          number;
  completedAt: string;
  approvedAt:  string | null;
  approvedBy:  number | null;
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
  completions: MissionCompletion[];
}

interface Props {
  childId:         number;
  isParentViewing: boolean;
}

function repeatLabel( mission: Mission ): string
{
  if( !mission.isRepeat ) return 'One-time';
  const every = mission.repeatEvery === 1 ? '' : `${mission.repeatEvery} `;
  return `Every ${every}${mission.repeatUnit}`;
}

function missionStatus( mission: Mission ): 'open' | 'pending' | 'done'
{
  if( mission.completions.length === 0 ) return 'open';
  const latest = mission.completions[0];
  if( latest.approvedAt === null ) return 'pending';
  return 'done';
}

export default function MissionPanel( { childId, isParentViewing }: Props )
{
  const [missions,       setMissions      ] = useState<Mission[]>( [] );
  const [newlyApproved,  setNewlyApproved ] = useState( 0 );
  const [open,           setOpen          ] = useState( true );
  const [submitting,     setSubmitting    ] = useState<number | null>( null );
  const [error,          setError         ] = useState( '' );

  const load = useCallback( async () =>
  {
    const res = await listMissions( isParentViewing ? childId : undefined );
    setMissions( res.data as Mission[] );

    if( !isParentViewing )
    {
      const notifRes = await getMissionNotifications();
      const { newlyApproved: n } = notifRes.data as { newlyApproved: number };
      setNewlyApproved( n );
    }
  }, [childId, isParentViewing] );

  useEffect( () =>
  {
    load();
    const interval = setInterval( load, 30_000 );
    return () => clearInterval( interval );
  }, [load] );

  async function handleOpen()
  {
    const next = !open;
    setOpen( next );
    if( next && newlyApproved > 0 && !isParentViewing )
    {
      await markMissionNotificationsSeen();
      setNewlyApproved( 0 );
    }
  }

  async function handleComplete( missionId: number )
  {
    setSubmitting( missionId );
    setError( '' );
    try
    {
      await completeMission( missionId );
      await load();
    }
    catch( e: unknown )
    {
      const msg = ( e as { response?: { data?: { error?: string } } } ).response?.data?.error ?? 'Failed to submit';
      setError( msg );
    }
    finally
    {
      setSubmitting( null );
    }
  }

  const badge = newlyApproved > 0 ? newlyApproved : null;

  return (
    <div className={styles.expandCard}>
      <button className={styles.expandHeader} onClick={handleOpen}>
        <span className={styles.expandTitle}>Missions</span>
        <span className={styles.expandRight}>
          {badge && (
            <span style={{ background: '#c6f6d5', color: '#276749', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
              {badge} approved
            </span>
          )}
          <span className={open ? styles.chevronOpen : styles.chevron}>▼</span>
        </span>
      </button>

      {open && (
        <div className={styles.expandBody}>
          {error && <p className={styles.error}>{error}</p>}

          {missions.length === 0 && (
            <p className={styles.empty}>No missions yet.</p>
          )}

          <ul className={styles.list}>
            {missions.map( ( m ) =>
            {
              const status = missionStatus( m );
              return (
                <li key={m.id} className={styles.item} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.type} style={{ fontWeight: 600 }}>{m.title}</span>
                    <span className={styles.positive}>+₪{m.reward.toFixed( 2 )}</span>
                  </div>

                  {m.description && (
                    <span style={{ fontSize: '0.82rem', color: '#718096' }}>{m.description}</span>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={styles.tag}>{repeatLabel( m )}</span>
                    {m.expiresAt && (
                      <span className={styles.tag} style={{ background: '#fffbeb', color: '#b7791f' }}>
                        Expires {new Date( m.expiresAt ).toLocaleDateString()}
                      </span>
                    )}
                    {status === 'open' && !isParentViewing && (
                      <button
                        className={styles.btn}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
                        disabled={submitting === m.id}
                        onClick={() => handleComplete( m.id )}
                      >
                        {submitting === m.id ? '…' : 'Mark Done'}
                      </button>
                    )}
                    {status === 'pending' && (
                      <span style={{ fontSize: '0.78rem', color: '#c05621', fontWeight: 600 }}>Pending approval</span>
                    )}
                    {status === 'done' && (
                      <span style={{ fontSize: '0.78rem', color: '#276749', fontWeight: 600 }}>Approved ✓</span>
                    )}
                  </div>
                </li>
              );
            } )}
          </ul>
        </div>
      )}
    </div>
  );
}
