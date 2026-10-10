import { useState } from 'react';
import Icon from '../icons.jsx';
import { applyTheme, getInitialTheme } from '../theme.js';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };
  return (
    <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle theme">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
