import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Form() {
  const { user } = useUser();
  const [formData, setFormData] = useState({ name: '', age: '', city: '', degree: '', phone: '' });
  const [isExisting, setIsExisting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserForm();
  }, []);

  const fetchUserForm = async () => {
    const res = await fetch('/api/forms');
    const data = await res.json();
    if (data.success && data.form) {
      setFormData(data.form);
      setIsExisting(true);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      setMessage('Form saved successfully');
      setIsExisting(true);
    } else {
      setMessage('Something went wrong!');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Welcome back, {user?.fullName || user?.firstName || 'User'}</h2>
      <p>You are logged in and ready to use the app.</p>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit} className="p-4 bg-light rounded">
        <input type="text" name="name" className="form-control mb-2" value={formData.name} onChange={handleChange} placeholder="Name" required />
        <input type="number" name="age" className="form-control mb-2" value={formData.age} onChange={handleChange} placeholder="Age" required />
        <input type="text" name="city" className="form-control mb-2" value={formData.city} onChange={handleChange} placeholder="City" required />
        <input type="text" name="degree" className="form-control mb-2" value={formData.degree} onChange={handleChange} placeholder="Degree" required />
        <input type="text" name="phone" className="form-control mb-3" value={formData.phone} onChange={handleChange} placeholder="Phone" required />
        <button type="submit" className="btn btn-success w-100">
          {isExisting ? 'Update Form' : 'Submit Form'}
        </button>
      </form>
    </div>
  );
}
