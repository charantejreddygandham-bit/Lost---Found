import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';
import { Alert, useDocTitle, useUI } from '../ui.jsx';
import AuthShell, { PasswordInput } from './AuthShell.jsx';

export default function Register() {
  useDocTitle('Create account');
  const { register } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const strength = Math.min(4, (form.password.length >= 6) + (form.password.length >= 10) + /[A-Z]/.test(form.password) + /\d|\W/.test(form.password));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      toast('Account created. Welcome!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="It’s free and takes 20 seconds.">
      <form onSubmit={submit} className="stack">
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={form.name} onChange={set} required autoFocus autoComplete="name" placeholder="Your name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={set} required autoComplete="email" placeholder="you@college.edu" />
        </div>
        <div className="field">
          <label htmlFor="password">Password <small>at least 6 characters</small></label>
          <PasswordInput id="password" name="password" value={form.password} onChange={set} minLength={6} autoComplete="new-password" placeholder="Choose a password" />
          <div className={`strength s${strength}`} aria-hidden="true"><i /><i /><i /><i /></div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="switch">Already registered? <Link to="/login" state={location.state}>Log in</Link></p>
      </form>
    </AuthShell>
  );
}
