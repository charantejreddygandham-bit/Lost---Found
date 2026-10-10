import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Avatar } from '../ui.jsx';

export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Campus Lost & Found home">
      <span className="brand-mark"><Icon name="search" size={19} strokeWidth={2.8} /></span>
      <span>Lost<span className="brand-amp">&amp;</span>Found</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>Browse</NavLink>
          {user && <NavLink to="/my-items">My reports</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link to="/report" className="btn btn-primary btn-sm nav-report">
            <Icon name="plus" size={16} strokeWidth={2.6} /> <span>Report item</span>
          </Link>
          {user ? (
            <div className="user-menu" ref={ref}>
              <button className="user-trigger" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
                <Avatar name={user.name} size={34} />
                <Icon name="chevronDown" size={14} className="hide-sm" />
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head">
                    <b>{user.name}</b>
                    <span>{user.email}</span>
                    {user.role === 'admin' && <em>Administrator</em>}
                  </div>
                  <Link to="/my-items" role="menuitem"><Icon name="list" size={16} /> My reports</Link>
                  {user.role === 'admin' && <Link to="/admin" role="menuitem"><Icon name="shield" size={16} /> Admin dashboard</Link>}
                  <button role="menuitem" onClick={() => { logout(); navigate('/'); }}>
                    <Icon name="logout" size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Mobile bottom tab bar for one-thumb navigation
export function BottomNav() {
  const { user } = useAuth();
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      <NavLink to="/" end><Icon name="home" size={21} /><span>Browse</span></NavLink>
      <NavLink to="/report" className="fab-link"><span className="fab"><Icon name="plus" size={24} strokeWidth={2.6} /></span><span>Report</span></NavLink>
      {user ? (
        <NavLink to="/my-items"><Icon name="list" size={21} /><span>Mine</span></NavLink>
      ) : (
        <NavLink to="/login"><Icon name="user" size={21} /><span>Log in</span></NavLink>
      )}
    </nav>
  );
}
