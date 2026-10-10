import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import ItemForm from '../components/ItemForm.jsx';
import { useDocTitle, useUI } from '../ui.jsx';

export default function ReportItem() {
  useDocTitle('Report an item');
  const navigate = useNavigate();
  const { toast } = useUI();
  const [params] = useSearchParams();
  const type = params.get('type') === 'found' ? 'found' : 'lost';

  const submit = async (fd) => {
    const { data } = await api.post('/items', fd);
    toast('Report posted. Thank you!');
    navigate(`/items/${data._id}`);
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Report an item</h1>
        <p>Four quick steps. You can edit or close the report any time.</p>
      </header>
      <ItemForm initial={{ type }} submitLabel="Post report" onSubmit={submit} />
    </div>
  );
}
