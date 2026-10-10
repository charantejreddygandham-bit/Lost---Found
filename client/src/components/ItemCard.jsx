import { Link } from 'react-router-dom';
import { imgUrl, formatDate } from '../api';
import Icon from '../icons.jsx';
import { CATEGORY_ICONS } from '../constants.js';
import { TypeBadge, timeAgo } from '../ui.jsx';

export function ItemThumb({ item, big }) {
  const src = imgUrl(item.image);
  return (
    <div className={`thumb ${item.type} ${big ? 'big' : ''}`}>
      {src ? <img src={src} alt={item.title} loading="lazy" /> : <Icon name={CATEGORY_ICONS[item.category] || 'box'} size={big ? 64 : 40} strokeWidth={1.5} />}
    </div>
  );
}

export default function ItemCard({ item, children }) {
  const resolved = item.status === 'resolved';
  return (
    <article className={`card item-card ${resolved ? 'is-resolved' : ''}`}>
      <Link to={`/items/${item._id}`} className="card-link">
        <div className="card-media">
          <ItemThumb item={item} />
          <div className="card-badges">
            <TypeBadge type={item.type} />
            {resolved && <span className="badge resolved"><Icon name="check" size={12} strokeWidth={3} /> Returned</span>}
          </div>
        </div>
        <div className="card-body">
          <span className="card-cat">{item.category}</span>
          <h3>{item.title}</h3>
          <p className="card-desc">{item.description}</p>
          <div className="card-meta">
            <span><Icon name="pin" size={14} /> {item.location}</span>
            <span title={formatDate(item.date)}><Icon name="clock" size={14} /> {timeAgo(item.date)}</span>
          </div>
        </div>
      </Link>
      {children && <div className="card-actions">{children}</div>}
    </article>
  );
}
