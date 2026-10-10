import { useState } from 'react';
import Icon from '../icons.jsx';
import { Logo } from '../components/Navbar.jsx';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth-side">
        <Logo />
        <div>
          <h2>Every lost item has a way home.</h2>
          <ul>
            <li><Icon name="checkCircle" size={18} /> Post a report in under a minute</li>
            <li><Icon name="checkCircle" size={18} /> Contact finders and owners directly</li>
            <li><Icon name="checkCircle" size={18} /> Track everything you’ve reported</li>
          </ul>
        </div>
        <span className="auth-foot">Made for students, by students.</span>
      </div>
      <div className="auth-form">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PasswordInput({ id, name, value, onChange, minLength, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input id={id} name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange} required minLength={minLength} autoComplete={autoComplete} placeholder={placeholder} />
      <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}
