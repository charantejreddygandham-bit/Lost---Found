import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Navbar, { BottomNav } from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import ReportItem from './pages/ReportItem.jsx';
import EditItem from './pages/EditItem.jsx';
import MyItems from './pages/MyItems.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';
import { Empty, PageLoader } from './ui.jsx';

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  const bare = pathname === '/login' || pathname === '/register';
  return (
    <>
      {!bare && <Navbar />}
      <main className={bare ? '' : 'container'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report" element={<Protected><ReportItem /></Protected>} />
          <Route path="/items/:id/edit" element={<Protected><EditItem /></Protected>} />
          <Route path="/my-items" element={<Protected><MyItems /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
          <Route path="*" element={<Empty icon="alert" title="Page not found" text="That page doesn’t exist." action={<Link className="btn btn-primary" to="/">Back to home</Link>} />} />
        </Routes>
      </main>
      {!bare && (
        <footer className="footer">
          <div className="container footer-inner">
            <b>Campus Lost &amp; Found</b>
            <span>Reuniting students with their belongings.</span>
          </div>
        </footer>
      )}
      {!bare && <BottomNav />}
    </>
  );
}
