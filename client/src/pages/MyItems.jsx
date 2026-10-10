import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import Icon from '../icons.jsx';
import ItemCard from '../components/ItemCard.jsx';
import { Alert, CardSkeletons, Empty, useDocTitle, useUI } from '../ui.jsx';

export default function MyItems() {
  useDocTitle('My reports');
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('open');

  useEffect(() => {
    api.get('/items/mine').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    try {
      const { data } = await api.patch(`/items/${id}/status`);
      setItems((l) => l.map((i) => (i._id === id ? data : i)));
      toast(data.status === 'resolved' ? 'Marked as resolved.' : 'Report re-opened.');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const remove = async (id) => {
    const ok = await confirm({ title: 'Delete this report?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/items/${id}`);
      setItems((l) => l.filter((i) => i._id !== id));
      toast('Report deleted.');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const open = items.filter((i) => i.status === 'open');
  const done = items.filter((i) => i.status === 'resolved');
  const shown = tab === 'open' ? open : done;

  return (
    <div className="page">
      <header className="page-head row">
        <div>
          <h1>My reports</h1>
          <p>Items you’ve posted. Mark them resolved once they’re back with their owner.</p>
        </div>
        <Link className="btn btn-primary" to="/report"><Icon name="plus" size={16} /> New report</Link>
      </header>
      <div className="segmented">
        <button className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>Open <em>{open.length}</em></button>
        <button className={tab === 'resolved' ? 'on' : ''} onClick={() => setTab('resolved')}>Resolved <em>{done.length}</em></button>
      </div>
      <Alert>{error}</Alert>
      {loading ? <CardSkeletons n={3} /> : shown.length === 0 ? (
        <Empty icon={tab === 'open' ? 'list' : 'checkCircle'} title={tab === 'open' ? 'No open reports' : 'Nothing resolved yet'} text={tab === 'open' ? 'Lost or found something? Post it and let the campus help.' : 'Resolved reports will show up here.'}
          action={tab === 'open' && <Link className="btn btn-primary" to="/report">Report an item</Link>} />
      ) : (
        <div className="grid">
          {shown.map((item) => (
            <ItemCard key={item._id} item={item}>
              <button className="btn btn-light btn-sm" onClick={() => toggle(item._id)}>
                <Icon name={item.status === 'open' ? 'check' : 'refresh'} size={14} /> {item.status === 'open' ? 'Resolve' : 'Re-open'}
              </button>
              <Link className="icon-btn" to={`/items/${item._id}/edit`} aria-label="Edit" title="Edit"><Icon name="edit" size={16} /></Link>
              <button className="icon-btn danger-text" onClick={() => remove(item._id)} aria-label="Delete" title="Delete"><Icon name="trash" size={16} /></button>
            </ItemCard>
          ))}
        </div>
      )}
    </div>
  );
}
