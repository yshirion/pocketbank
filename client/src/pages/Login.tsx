import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth, User } from '../context/AuthContext';
import styles from './Auth.module.css';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await login(username, password);
      const user = res.data as User;
      setUser(user);
      navigate(user.isParent ? '/parent' : '/child');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { error?: string } } })?.response;
      if (status?.data?.error === 'pending_approval') {
        setError('Your account is waiting for parent approval.');
      } else {
        setError('Invalid username or password.');
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src={logoImg} alt="PocketBank" className={styles.logoImg} />
        <h1 className={styles.title}>PocketBank</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit">Sign In</button>
        </form>
        <div className={styles.links}>
          <Link to="/register/parent">New family? Register here</Link>
          <Link to="/register/child">Join existing family</Link>
        </div>
      </div>
    </div>
  );
}
