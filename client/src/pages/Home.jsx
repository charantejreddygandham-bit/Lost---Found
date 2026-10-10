import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { CATEGORIES, CATEGORY_ICONS } from '../constants.js';
import Icon from '../icons.jsx';
import ItemCard from '../components/ItemCard.jsx';
import { Alert, CardSkeletons, Empty, useDocTitle } from '../ui.jsx';

const TYPES = [
  { v: '', label: 'All' },
  { v: 'lost', label: 'Lost' },
  { v: 'found', label: 'Found' },
];

export default function Home() {
  useDocTitle('');
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get('q') || '',
    type: params.get('type') || '',
    category: params.get('category') || '',
    status: params.get('status') || 'open',
    sort: params.get('sort') || 'new',
  };
  const [qInput, setQInput] = useState(filters.q);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const update = (patch) => {
    const next = { ...filters, ...patch };
    const p = {};
    if (next.q) p.q = next.q;
    if (next.type) p.type = next.type;
    if (next.category) p.category = next.category;
    if (next.status !== 'open') p.status = next.status || 'any';
    if (next.sort !== 'new') p.sort = next.sort;
    setParams(p, { replace: true });
  };

  useEffect(() => {
    api.get('/items/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  // debounce typing into the URL
  useEffect(() => {
    if (qInput === filters.q) return;
    const t = setTimeout(() => update({ q: qInput }), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const apiStatus = filters.status === 'any' ? '' : filters.status;
    api
      .get('/items', { params: { q: filters.q, type: filters.type, category: filters.category, status: apiStatus } })
      .then(({ data }) => !cancelled && (setItems(data), setError('')))
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters.q, filters.type, filters.category, filters.status]);

  // press "/" to jump to search
  useEffect(() => {
    const h = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const sorted = [...items].sort((a, b) =>
    filters.sort === 'old' ? new Date(a.date) - new Date(b.date) : new Date(b.createdAt) - new Date(a.createdAt)
  );
  const hasFilters = filters.q || filters.type || filters.category || filters.status !== 'open';
  const clear = () => { setQInput(''); setParams({}, { replace: true }); };
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Icon name="sparkle" size={14} /> Campus Lost &amp; Found</span>
          <h1>Lost it? Found it?<br /><span>Let’s get it home.</span></h1>
          <p>Search the campus board in seconds, or post an item so the right person finds it.</p>

          <form className="hero-search" onSubmit={(e) => { e.preventDefault(); update({ q: qInput }); scrollToList(); }}>
            <Icon name="search" size={20} />
            <input
              ref={searchRef}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search “blue bottle”, “ID card”, “library”…"
              aria-label="Search items"
            />
            <kbd className="hide-sm">/</kbd>
            <button className="btn btn-primary" type="submit">Search</button>
          </form>

          <div className="hero-cta">
            <Link to="/report?type=lost" className="cta lost"><Icon name="megaphone" size={18} /> I lost something</Link>
            <Link to="/report?type=found" className="cta found"><Icon name="handshake" size={18} /> I found something</Link>
          </div>
        </div>

        {stats && (
          <div className="hero-stats" aria-label="Portal statistics">
            <button className="stat" onClick={() => { update({ type: 'lost', status: 'open' }); scrollToList(); }}>
              <span className="stat-ico lost"><Icon name="search" size={20} /></span>
              <b>{stats.lostOpen}</b><span>Still missing</span>
            </button>
            <button className="stat" onClick={() => { update({ type: 'found', status: 'open' }); scrollToList(); }}>
              <span className="stat-ico found"><Icon name="box" size={20} /></span>
              <b>{stats.foundOpen}</b><span>Waiting for owner</span>
            </button>
            <button className="stat" onClick={() => { update({ type: '', status: 'resolved' }); scrollToList(); }}>
              <span className="stat-ico done"><Icon name="checkCircle" size={20} /></span>
              <b>{stats.resolved}</b><span>Reunited</span>
            </button>
          </div>
        )}
      </section>

      <section className="browse" ref={listRef}>
        <div className="toolbar">
          <div className="segmented" role="tablist" aria-label="Type">
            {TYPES.map((t) => (
              <button key={t.v} role="tab" aria-selected={filters.type === t.v} className={filters.type === t.v ? 'on' : ''} onClick={() => update({ type: t.v })}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select value={filters.status} onChange={(e) => update({ status: e.target.value })} aria-label="Status">
              <option value="open">Open</option>
              <option value="resolved">Returned</option>
              <option value="any">All statuses</option>
            </select>
            <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
              <option value="new">Newest posted</option>
              <option value="old">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="cat-scroll" role="group" aria-label="Categories">
          <button className={`pill ${!filters.category ? 'on' : ''}`} onClick={() => update({ category: '' })}>
            <Icon name="grid" size={16} /> All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`pill ${filters.category === c ? 'on' : ''}`} onClick={() => update({ category: filters.category === c ? '' : c })}>
              <Icon name={CATEGORY_ICONS[c]} size={16} /> {c}
            </button>
          ))}
        </div>

        <div className="results-bar">
          <span aria-live="polite">{loading ? 'Searching…' : `${sorted.length} ${sorted.length === 1 ? 'item' : 'items'}${filters.q ? ` for “${filters.q}”` : ''}`}</span>
          {hasFilters && <button className="link-btn" onClick={clear}><Icon name="x" size={14} /> Clear filters</button>}
        </div>

        <Alert>{error}</Alert>
        {loading && items.length === 0 ? (
          <CardSkeletons />
        ) : sorted.length === 0 ? (
          <Empty
            title="Nothing matches yet"
            text={hasFilters ? 'Try different words, or clear the filters.' : 'No reports have been posted yet.'}
            action={
              <div className="empty-actions">
                {hasFilters && <button className="btn btn-light" onClick={clear}>Clear filters</button>}
                <Link className="btn btn-primary" to="/report">Report an item</Link>
              </div>
            }
          />
        ) : (
          <div className={`grid ${loading ? 'dim' : ''}`}>
            {sorted.map((item) => <ItemCard key={item._id} item={item} />)}
          </div>
        )}
      </section>

      <section className="how">
        <h2>How it works</h2>
        <div className="how-grid">
          {[
            ['megaphone', 'Post it', 'Describe what you lost or found, add a photo and a place. Takes under a minute.'],
            ['search', 'Get matched', 'Anyone on campus can search by keyword, category or location.'],
            ['handshake', 'Reunite', 'Contact each other, hand it back, then mark the report as resolved.'],
          ].map(([ic, t, d], i) => (
            <div className="how-step" key={t}>
              <span className="how-num">{i + 1}</span>
              <span className="how-ico"><Icon name={ic} size={22} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
