import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerChild } from '../services/api';
import styles from './Auth.module.css';

export default function RegisterChild() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '', familyId: '' });
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await registerChild({ ...form, familyId: Number(form.familyId) });
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed.');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Join Family</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input className={styles.input} placeholder="First name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          <input className={styles.input} placeholder="Last name (must match family name)" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          <input className={styles.input} placeholder="Username" value={form.username} onChange={(e) => set('username', e.target.value)} required />
          <input className={styles.input} type="password" placeholder="Password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
          <input className={styles.input} placeholder="Family ID (ask your parent)" value={form.familyId} onChange={(e) => set('familyId', e.target.value)} required />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit">Join Family</button>
        </form>
        <div className={styles.links}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
