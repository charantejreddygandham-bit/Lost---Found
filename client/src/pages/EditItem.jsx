import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import ItemForm from '../components/ItemForm.jsx';
import Icon from '../icons.jsx';
import { Alert, PageLoader, useDocTitle, useUI } from '../ui.jsx';

export default function EditItem() {
  useDocTitle('Edit report');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/items/${id}`).then((r) => setItem(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  const submit = async (fd) => {
    await api.put(`/items/${id}`, fd);
    toast('Changes saved.');
    navigate(`/items/${id}`);
  };

  if (error) return <div className="page"><Alert>{error}</Alert></div>;
  if (!item) return <PageLoader />;

  return (
    <div className="page">
      <Link to={`/items/${id}`} className="back"><Icon name="arrowLeft" size={16} /> Back to item</Link>
      <header className="page-head">
        <h1>Edit report</h1>
      </header>
      <ItemForm initial={item} submitLabel="Save changes" onSubmit={submit} />
    </div>
  );
}
