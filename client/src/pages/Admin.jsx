import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, formatDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../icons.jsx';
import { Alert, Avatar, PageLoader, StatusBadge, TypeBadge, useDocTitle, useUI } from '../ui.jsx';

export default function Admin() {
  useDocTitle('Admin');
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('items');
  const [q, setQ] = useState('');

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/items')])
      .then(([u, i]) => { setUsers(u.data); setItems(i.data); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    try {
      const { data } = await api.patch(`/items/${id}/status`);
      setItems((l) => l.map((i) => (i._id === id ? data : i)));
      toast('Status updated.');
    } catch (e) { toast(errMsg(e), 'error'); }
  };
  const removeItem = async (id) => {
    if (!(await confirm({ title: 'Delete item?', message: 'This permanently removes the report.', confirmLabel: 'Delete', danger: true }))) return;
    try { await api.delete(`/items/${id}`); setItems((l) => l.filter((i) => i._id !== id)); toast('Item deleted.'); }
    catch (e) { toast(errMsg(e), 'error'); }
  };
  const removeUser = async (u) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, message: 'The user and all of their reports will be removed.', confirmLabel: 'Delete user', danger: true }))) return;
    try {
      await api.delete(`/users/${u.id}`);
      setUsers((l) => l.filter((x) => x.id !== u.id));
      setItems((l) => l.filter((i) => !i.owner || i.owner._id !== u.id));
      toast('User deleted.');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const needle = q.trim().toLowerCase();
  const fItems = useMemo(() => items.filter((i) => !needle || `${i.title} ${i.owner?.name || ''} ${i.location}`.toLowerCase().includes(needle)), [items, needle]);
  const fUsers = useMemo(() => users.filter((u) => !needle || `${u.name} ${u.email}`.toLowerCase().includes(needle)), [users, needle]);

  if (loading) return <PageLoader />;
  const open = items.filter((i) => i.status === 'open').length;

  return (
    <div className="page">
      <header className="page-head"><h1>Admin dashboard</h1><p>Moderate reports and manage accounts.</p></header>
      <Alert>{error}</Alert>
      <div className="admin-stats">
        <div className="card"><span className="stat-ico lost"><Icon name="list" size={20} /></span><b>{items.length}</b><span>Total reports</span></div>
        <div className="card"><span className="stat-ico found"><Icon name="box" size={20} /></span><b>{open}</b><span>Open</span></div>
        <div className="card"><span className="stat-ico done"><Icon name="checkCircle" size={20} /></span><b>{items.length - open}</b><span>Resolved</span></div>
        <div className="card"><span className="stat-ico user"><Icon name="users" size={20} /></span><b>{users.length}</b><span>Users</span></div>
      </div>

      <div className="toolbar">
        <div className="segmented">
          <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>Items <em>{items.length}</em></button>
          <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Users <em>{users.length}</em></button>
        </div>
        <label className="search-sm">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} />
        </label>
      </div>

      <div className="card table-card">
        {tab === 'items' ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Reported by</th><th>Date</th><th /></tr></thead>
              <tbody>
                {fItems.map((i) => (
                  <tr key={i._id}>
                    <td><Link className="row-link" to={`/items/${i._id}`}>{i.title}</Link><small>{i.location}</small></td>
                    <td><TypeBadge type={i.type} /></td>
                    <td><StatusBadge status={i.status} /></td>
                    <td>{i.owner?.name || '—'}</td>
                    <td>{formatDate(i.date)}</td>
                    <td className="row-actions">
                      <button className="btn btn-light btn-sm" onClick={() => toggle(i._id)}>{i.status === 'open' ? 'Resolve' : 'Re-open'}</button>
                      <button className="icon-btn danger-text" onClick={() => removeItem(i._id)} aria-label="Delete"><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                ))}
                {fItems.length === 0 && <tr><td colSpan="6" className="muted center-cell">No items found.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {fUsers.map((u) => (
                  <tr key={u.id}>
                    <td><div className="user-cell"><Avatar name={u.name} size={34} /><div><b>{u.name}</b><small>{u.email}</small></div></div></td>
                    <td><span className={`badge ${u.role === 'admin' ? 'open' : 'neutral'}`}>{u.role}</span></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="row-actions">
                      {u.role !== 'admin' && u.id !== user.id && (
                        <button className="icon-btn danger-text" onClick={() => removeUser(u)} aria-label={`Delete ${u.name}`}><Icon name="trash" size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
                {fUsers.length === 0 && <tr><td colSpan="4" className="muted center-cell">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
