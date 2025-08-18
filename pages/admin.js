import { useUser, useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => new URLSearchParams({ page, limit, q: search }).toString(), [page, limit, search]);

  const fetchForms = async (notify = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/forms?${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.status === 401) {
        toast.error('Session expired. Please log in again.');
        signOut({ redirectUrl: '/sign-in' });
        return;
      }
      if (res.status === 403) {
        toast.error('Admins only.');
        router.push('/');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setRows(data.forms || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
        if (notify) toast.success('Loaded.');
      } else {
        toast.error(data.message || 'Failed to load forms');
      }
    } catch {
      toast.error('Error loading forms');
    } finally {
      setLoading(false);
    }
  };

  // auth gate + initial load
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (isLoaded && isSignedIn) {
      if (user?.publicMetadata?.role === 'admin') fetchForms();
      else router.replace('/');
    }
  }, [isLoaded, isSignedIn, user, page, limit]); // re-run on pagination change

  // refetch when search stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1); // reset to first page for new search
      fetchForms();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this form?')) return;
    try {
      const res = await fetch(`/api/admin/delete-form`, { 
        method: 'DELETE', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: id })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Form deleted successfully');
        // if we deleted the last item on last page, move back one page
        if (rows.length === 1 && page > 1) setPage(p => p - 1);
        else fetchForms(false);
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete error');
    }
  };

  const handleEditClick = (row) => {
    setEditId(row._id);
    setEditForm({
      name: row.name || '',
      age: row.age || '',
      city: row.city || '',
      degree: row.degree || '',
      phone: row.phone || '',
    });
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSave = async () => {
    try {
      const res = await fetch(`/api/forms/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Updated');
        setEditId(null);
        fetchForms(false);
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch {
      toast.error('Update error');
    }
  };

  if (!isLoaded) return <div className="text-center mt-5">Loading...</div>;
  if (!isSignedIn || user?.publicMetadata?.role !== 'admin') return null;

  return (
    <>
      <style jsx>{`
        .full-width-admin-container {
          width: 100vw;
          padding: 1rem;
          margin: 0;
          max-width: none;
        }
        
        @media (max-width: 768px) {
          .full-width-admin-container {
            padding: 0.5rem !important;
            width: 100vw !important;
          }
          
          .admin-header {
            flex-direction: column !important;
            gap: 1rem !important;
            align-items: center !important;
          }
          
          .admin-controls {
            flex-direction: column !important;
            width: 100% !important;
            align-items: stretch !important;
          }
          
          .admin-controls input {
            min-width: 100% !important;
          }
        }
      `}</style>
      
      <div className="full-width-admin-container">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 admin-header">
          <h2 className="m-0">Admin Panel — All User Submissions</h2>

          <div className="d-flex gap-2 align-items-center admin-controls">
          <button
            className="btn btn-info"
            onClick={() => router.push('/admin/users')}
          >
            Manage Users
          </button>
          <input
            type="text"
            className="form-control"
            style={{ minWidth: 260 }}
            placeholder="Search name, city, degree, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 110 }}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            title="Rows per page"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      <div className="mb-2 text-muted small">
        {loading ? 'Loading…' : `Showing ${rows.length} of ${total} result(s)`}
      </div>

      {rows.length === 0 && !loading && <p className="text-secondary">No submissions found.</p>}

      {rows.map((item) => (
        <div
          key={item._id}
          className="border rounded p-3 mb-3 bg-dark text-light"
          style={{ transition: 'transform .2s, box-shadow .2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,.35)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          {editId === item._id ? (
            <div className="row g-2">
              <div className="col-12 col-md-4">
                <input className="form-control" name="name" value={editForm.name} onChange={handleEditChange} />
              </div>
              <div className="col-6 col-md-2">
                <input className="form-control" type="number" name="age" value={editForm.age} onChange={handleEditChange} />
              </div>
              <div className="col-6 col-md-2">
                <input className="form-control" name="city" value={editForm.city} onChange={handleEditChange} />
              </div>
              <div className="col-12 col-md-2">
                <input className="form-control" name="degree" value={editForm.degree} onChange={handleEditChange} />
              </div>
              <div className="col-12 col-md-2">
                <input className="form-control" name="phone" value={editForm.phone} onChange={handleEditChange} />
              </div>

              <div className="col-12 d-flex gap-2 mt-2">
                <button className="btn btn-success btn-sm" onClick={handleEditSave}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column flex-md-row justify-content-between gap-2 align-items-start align-items-md-center">
              <div className="pe-md-3">
                <strong className="text-info">{item.name}</strong>
                <span className="ms-2">| Age: {item.age}</span>
                <span className="ms-2">| City: {item.city}</span>
                <span className="ms-2">| Degree: {item.degree}</span>
                <span className="ms-2">| Phone: {item.phone}</span>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-warning btn-sm" onClick={() => handleEditClick(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      <nav aria-label="Forms pagination">
        <ul className="pagination justify-content-center mt-3">
          <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(1)} aria-label="First">«</button>
          </li>
          <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(p => Math.max(p - 1, 1))} aria-label="Previous">‹</button>
          </li>

          {/* show up to 5 page buttons centered around current */}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                {idx < arr.length - 1 && arr[idx + 1] - p > 1 && (
                  <span className="page-link disabled border-0">…</span>
                )}
              </li>
            ))}

          <li className={`page-item ${page >= pages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(p => Math.min(p + 1, pages))} aria-label="Next">›</button>
          </li>
          <li className={`page-item ${page >= pages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(pages)} aria-label="Last">»</button>
          </li>
        </ul>
      </nav>
      </div>
    </>
  );
}
