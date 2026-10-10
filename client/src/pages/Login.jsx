import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';
import { Alert, useDocTitle } from '../ui.jsx';
import AuthShell, { PasswordInput } from './AuthShell.jsx';

export default function Login() {
  useDocTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to report items and contact finders.">
      <form onSubmit={submit} className="stack">
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={set} required autoFocus autoComplete="email" placeholder="you@college.edu" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" value={form.password} onChange={set} autoComplete="current-password" placeholder="Your password" />
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="switch">New here? <Link to="/register" state={location.state}>Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
