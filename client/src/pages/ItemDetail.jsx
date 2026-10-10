import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, imgUrl, formatDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../icons.jsx';
import { ItemThumb } from '../components/ItemCard.jsx';
import ItemCard from '../components/ItemCard.jsx';
import { Alert, Avatar, PageLoader, StatusBadge, TypeBadge, timeAgo, useDocTitle, useUI } from '../ui.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast, confirm } = useUI();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useDocTitle(item?.title);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    api
      .get(`/items/${id}`)
      .then((r) => setItem(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id, user, authLoading]);

  // "Possible matches": opposite type, same category
  useEffect(() => {
    if (!item) return;
    api
      .get('/items', { params: { type: item.type === 'lost' ? 'found' : 'lost', category: item.category, status: 'open' } })
      .then((r) => setSimilar(r.data.filter((i) => i._id !== item._id).slice(0, 3)))
      .catch(() => {});
  }, [item?._id]);

  if (loading || authLoading) return <PageLoader />;
  if (error || !item) return <div className="page"><Link to="/" className="back"><Icon name="arrowLeft" size={16} /> Back</Link><Alert>{error || 'Item not found.'}</Alert></div>;

  const canManage = user && (user.role === 'admin' || (item.owner && item.owner._id === user.id));
  const resolved = item.status === 'resolved';
  const lost = item.type === 'lost';

  const toggleStatus = async () => {
    try {
      const { data } = await api.patch(`/items/${item._id}/status`);
      setItem(data);
      toast(data.status === 'resolved' ? 'Marked as resolved. Glad it worked out!' : 'Report re-opened.');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const remove = async () => {
    const ok = await confirm({ title: 'Delete this report?', message: 'This permanently removes the report and its photo.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/items/${item._id}`);
      toast('Report deleted.');
      navigate('/');
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Link copied.');
    } catch { toast('Could not copy link', 'error'); }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item.title, url: window.location.href }); } catch {}
    } else copyLink();
  };

  const src = imgUrl(item.image);

  return (
    <div className="page">
      <Link to="/" className="back"><Icon name="arrowLeft" size={16} /> All items</Link>

      <div className="detail">
        <div className="detail-main">
          <div className="detail-media">
            <ItemThumb item={item} big />
            {src && <a className="zoom" href={src} target="_blank" rel="noreferrer">View full size</a>}
          </div>

          <div className="card detail-body">
            <div className="detail-badges">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
              <span className="card-cat">{item.category}</span>
            </div>
            <h1>{item.title}</h1>
            <div className="facts">
              <div><Icon name="pin" size={18} /><span>{lost ? 'Last seen' : 'Found at'}</span><b>{item.location}</b></div>
              <div><Icon name="calendar" size={18} /><span>{lost ? 'Lost on' : 'Found on'}</span><b>{formatDate(item.date)}</b></div>
              <div><Icon name="clock" size={18} /><span>Posted</span><b>{timeAgo(item.createdAt)}</b></div>
            </div>
            <h2>Description</h2>
            <p className="desc">{item.description}</p>
          </div>
        </div>

        <aside className="detail-side">
          <div className="card side-card">
            <h3>{lost ? 'Seen this item?' : 'Is this yours?'}</h3>
            <div className="poster">
              <Avatar name={item.owner?.name} size={44} />
              <div>
                <b>{item.owner?.name || 'Unknown'}</b>
                <span>Reported {timeAgo(item.createdAt)}</span>
              </div>
            </div>

            {resolved ? (
              <div className="resolved-note"><Icon name="checkCircle" size={20} /> This item has been reunited. No action needed.</div>
            ) : user ? (
              <div className="contact-list">
                {item.owner?.email && (
                  <a className="contact" href={`mailto:${item.owner.email}?subject=${encodeURIComponent(`About your ${lost ? 'lost' : 'found'} item: ${item.title}`)}`}>
                    <Icon name="mail" size={18} /><span>{item.owner.email}</span>
                  </a>
                )}
                {item.contactInfo && (
                  <a className="contact" href={/^\d{10}$/.test(item.contactInfo) ? `tel:${item.contactInfo}` : undefined}>
                    <Icon name="phone" size={18} /><span>{/^\d{10}$/.test(item.contactInfo) ? `${item.contactInfo.slice(0, 5)} ${item.contactInfo.slice(5)}` : item.contactInfo}</span>
                  </a>
                )}
                {item.owner?.email && (
                  <a className="btn btn-primary btn-block" href={`mailto:${item.owner.email}?subject=${encodeURIComponent(`About: ${item.title}`)}`}>
                    <Icon name="mail" size={16} /> {lost ? 'I’ve seen it' : 'This is mine'}
                  </a>
                )}
              </div>
            ) : (
              <div className="locked">
                <Icon name="lock" size={20} />
                <p>Contact details are visible to logged-in students only.</p>
                <Link className="btn btn-primary btn-block" to="/login" state={{ from: `/items/${item._id}` }}>Log in to contact</Link>
                <Link className="link-btn" to="/register">Create an account</Link>
              </div>
            )}

            <div className="side-tools">
              <button className="btn btn-light btn-sm" onClick={share}><Icon name="share" size={15} /> Share</button>
              <button className="btn btn-light btn-sm" onClick={copyLink}><Icon name="copy" size={15} /> Copy link</button>
            </div>
          </div>

          {canManage && (
            <div className="card side-card">
              <h3>Manage report</h3>
              <button className={`btn btn-block ${resolved ? 'btn-light' : 'btn-success'}`} onClick={toggleStatus}>
                <Icon name={resolved ? 'refresh' : 'check'} size={16} /> {resolved ? 'Re-open report' : 'Mark as resolved'}
              </button>
              <div className="split">
                <Link className="btn btn-light" to={`/items/${item._id}/edit`}><Icon name="edit" size={15} /> Edit</Link>
                <button className="btn btn-light danger-text" onClick={remove}><Icon name="trash" size={15} /> Delete</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && !resolved && (
        <section className="similar">
          <h2>Possible {lost ? 'matches' : 'owners'}</h2>
          <p className="muted">Open {lost ? 'found' : 'lost'} reports in “{item.category}”</p>
          <div className="grid">{similar.map((s) => <ItemCard key={s._id} item={s} />)}</div>
        </section>
      )}
    </div>
  );
}
