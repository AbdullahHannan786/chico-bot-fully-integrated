import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');

  const fetchAllForms = async (showToast = true) => {
    try {
      const res = await fetch('/api/admin/forms');
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions(data.forms);
        if (showToast) toast.success('Forms fetched successfully!');
      } else {
        toast.error(data.message || 'Failed to load forms');
      }
    } catch (error) {
      toast.error('An error occurred while fetching forms');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin') fetchAllForms();
      else router.push('/');
    }
  }, [session, status]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this form?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Form deleted successfully!");
        fetchAllForms(false);
      } else {
        toast.error("Failed to delete form");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  };

  const handleEditClick = (form) => {
    setEditId(form._id);
    setEditForm({
      name: form.name,
      age: form.age,
      city: form.city,
      degree: form.degree,
      phone: form.phone,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`/api/forms/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Form updated successfully!");
        setEditId(null);
        fetchAllForms(false);
      } else {
        toast.error(data.message || "Failed to update form");
      }
    } catch (error) {
      toast.error("An error occurred while updating form");
    }
  };

  if (status === 'loading') return <div className="text-center mt-5">Loading...</div>;
  if (!session || session.user.role !== 'admin') return null;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Panel – All User Submissions</h2>

      {/* Search bar */}
      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search by name, city, or degree..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {submissions.length === 0 && <p>No submissions yet.</p>}

      {submissions
        .filter(item => {
          const term = search.toLowerCase();
          return (
            item.name.toLowerCase().includes(term) ||
            item.city.toLowerCase().includes(term) ||
            item.degree.toLowerCase().includes(term)
          );
        })
        .map((item) => (
          <div key={item._id} className="border rounded p-3 mb-3">
            {editId === item._id ? (
              <div>
                <input className="form-control mb-2" name="name" value={editForm.name} onChange={handleEditChange} />
                <input className="form-control mb-2" name="age" value={editForm.age} onChange={handleEditChange} />
                <input className="form-control mb-2" name="city" value={editForm.city} onChange={handleEditChange} />
                <input className="form-control mb-2" name="degree" value={editForm.degree} onChange={handleEditChange} />
                <input className="form-control mb-2" name="phone" value={editForm.phone} onChange={handleEditChange} />
                <button className="btn btn-success btn-sm me-2" onClick={handleEditSave}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{item.name}</strong> | Age: {item.age} | City: {item.city} | Degree: {item.degree} | Phone: {item.phone}
                </div>
                <div>
                  <button className="btn btn-warning btn-sm me-2 mb-1" onClick={() => handleEditClick(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}