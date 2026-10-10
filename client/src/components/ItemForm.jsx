import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, CATEGORY_ICONS, POPULAR_PLACES } from '../constants.js';
import { errMsg, imgUrl } from '../api';
import Icon from '../icons.jsx';
import { Alert, TypeBadge } from '../ui.jsx';
import { ItemThumb } from './ItemCard.jsx';

function todayLocal(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function ItemForm({ initial, submitLabel, onSubmit }) {
  const [form, setForm] = useState({
    type: initial?.type || 'lost',
    title: initial?.title || '',
    category: initial?.category || '',
    location: initial?.location || '',
    date: initial?.date ? initial.date.slice(0, 10) : todayLocal(),
    description: initial?.description || '',
    contactInfo: (initial?.contactInfo || '').replace(/\D/g, '').slice(-10),
  });
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    if (initial?.image && !removeImage) return imgUrl(initial.image);
    return null;
  }, [file, initial, removeImage]);
  useEffect(() => () => file && preview && URL.revokeObjectURL(preview), [file, preview]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneOk = /^\d{10}$/.test(form.contactInfo);
  const onChange = (e) => set(e.target.name, e.target.value);

  const takeFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Please choose an image file (JPG, PNG, WebP).');
    if (f.size > 5 * 1024 * 1024) return setError('Image must be 5MB or smaller.');
    setError('');
    setFile(f);
    setRemoveImage(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please pick a category.');
    if (!phoneOk) { setPhoneTouched(true); return setError('Enter a 10-digit phone number so people can reach you.'); }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      if (removeImage) fd.append('removeImage', 'true');
      await onSubmit(fd);
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  const lost = form.type === 'lost';
  const hasImage = !!preview;
  const live = { ...form, category: form.category || 'Other', image: '', status: 'open' };

  return (
    <form className="report-layout" onSubmit={submit}>
      <div className="form-col">
        <Alert onClose={() => setError('')}>{error}</Alert>

        <section className="card form-section">
          <h3><span className="step-n">1</span> What happened?</h3>
          <div className="type-choice" role="radiogroup">
            <button type="button" role="radio" aria-checked={lost} className={`type-card lost ${lost ? 'on' : ''}`} onClick={() => set('type', 'lost')}>
              <Icon name="search" size={22} />
              <b>I lost something</b>
              <span>Post it so finders can reach you</span>
            </button>
            <button type="button" role="radio" aria-checked={!lost} className={`type-card found ${!lost ? 'on' : ''}`} onClick={() => set('type', 'found')}>
              <Icon name="handshake" size={22} />
              <b>I found something</b>
              <span>Help it get back to its owner</span>
            </button>
          </div>
        </section>

        <section className="card form-section">
          <h3><span className="step-n">2</span> Describe the item</h3>
          <div className="field">
            <label htmlFor="title">Item name</label>
            <input id="title" name="title" value={form.title} onChange={onChange} maxLength={100} required placeholder="e.g. Black Wildcraft backpack" autoFocus={!initial} />
          </div>
          <div className="field">
            <label id="cat-label">Category</label>
            <div className="cat-grid" role="radiogroup" aria-labelledby="cat-label">
              {CATEGORIES.map((c) => (
                <button type="button" role="radio" aria-checked={form.category === c} key={c} className={`cat-opt ${form.category === c ? 'on' : ''}`} onClick={() => set('category', c)}>
                  <Icon name={CATEGORY_ICONS[c]} size={18} />
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Details <small>colour, brand, marks, what’s inside</small></label>
            <textarea id="description" name="description" rows={4} value={form.description} onChange={onChange} maxLength={1000} required placeholder="Anything that helps prove it’s yours (or helps you find the owner)…" />
            <span className="counter">{form.description.length}/1000</span>
          </div>
        </section>

        <section className="card form-section">
          <h3><span className="step-n">3</span> Where &amp; when</h3>
          <div className="field">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" value={form.location} onChange={onChange} maxLength={150} required placeholder="e.g. Library, 2nd floor reading hall" />
            <div className="chips">
              {POPULAR_PLACES.map((p) => (
                <button type="button" key={p} className="chip" onClick={() => set('location', p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="date">Date {lost ? 'lost' : 'found'}</label>
            <div className="date-row">
              <input id="date" type="date" name="date" value={form.date} onChange={onChange} max={todayLocal()} required />
              <button type="button" className={`chip ${form.date === todayLocal() ? 'on' : ''}`} onClick={() => set('date', todayLocal())}>Today</button>
              <button type="button" className={`chip ${form.date === todayLocal(1) ? 'on' : ''}`} onClick={() => set('date', todayLocal(1))}>Yesterday</button>
            </div>
          </div>
        </section>

        <section className="card form-section">
          <h3><span className="step-n">4</span> Photo &amp; contact</h3>
          <div
            className={`dropzone ${drag ? 'drag' : ''} ${hasImage ? 'has' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files[0]); }}
          >
            {hasImage ? (
              <>
                <img src={preview} alt="Selected" />
                <div className="dz-actions">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => fileRef.current.click()}>Replace</button>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => { setFile(null); setRemoveImage(true); if (fileRef.current) fileRef.current.value = ''; }}>Remove</button>
                </div>
              </>
            ) : (
              <button type="button" className="dz-empty" onClick={() => fileRef.current.click()}>
                <span className="dz-icon"><Icon name="upload" size={22} /></span>
                <b>Drop a photo here or click to upload</b>
                <span>JPG, PNG or WebP · up to 5MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => takeFile(e.target.files[0])} />
          </div>
          <div className="field">
            <label htmlFor="contactInfo">Phone number <small>10 digits, only visible to logged-in students</small></label>
            <input
              id="contactInfo" name="contactInfo" type="tel" inputMode="numeric" autoComplete="tel-national"
              value={form.contactInfo} maxLength={10} required placeholder="9876543210"
              aria-invalid={phoneTouched && !phoneOk}
              className={phoneTouched && !phoneOk ? 'invalid' : ''}
              onChange={(e) => set('contactInfo', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => setPhoneTouched(true)}
            />
            <span className={`counter ${phoneOk ? 'good' : ''}`}>
              {phoneTouched && !phoneOk ? 'Phone number must be exactly 10 digits. ' : ''}{form.contactInfo.length}/10
            </span>
          </div>
        </section>

        <div className="form-submit">
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>

      <aside className="preview-col" aria-label="Live preview">
        <div className="preview-sticky">
          <span className="eyebrow">Live preview</span>
          <article className="card item-card">
            <div className="card-media">
              {hasImage ? <div className={`thumb ${form.type}`}><img src={preview} alt="" /></div> : <ItemThumb item={live} />}
              <div className="card-badges"><TypeBadge type={form.type} /></div>
            </div>
            <div className="card-body">
              <span className="card-cat">{form.category || 'Category'}</span>
              <h3>{form.title || 'Your item name'}</h3>
              <p className="card-desc">{form.description || 'Details will appear here.'}</p>
              <div className="card-meta">
                <span><Icon name="pin" size={14} /> {form.location || 'Location'}</span>
                <span><Icon name="clock" size={14} /> {form.date === todayLocal() ? 'today' : form.date}</span>
              </div>
            </div>
          </article>
          <p className="tip"><Icon name="sparkle" size={16} /> Tip: a clear photo and a specific location get items matched up to 3× faster.</p>
        </div>
      </aside>
    </form>
  );
}
