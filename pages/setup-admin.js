import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function MakeAdmin() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const makeAdmin = async () => {
    if (!window.confirm('Are you sure you want to make yourself an admin?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeAdmin: true })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to grant admin access');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to grant admin access');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Admin Setup</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <strong>Security Note:</strong> This is a one-time setup tool. 
                After making yourself admin, you should remove this page or restrict access.
              </div>

              <h5>Current User Info:</h5>
              <ul>
                <li><strong>Name:</strong> {user.fullName || user.firstName}</li>
                <li><strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress}</li>
                <li><strong>Current Role:</strong> {user.publicMetadata?.role || 'user'}</li>
                <li><strong>User ID:</strong> <code>{user.id}</code></li>
              </ul>

              {user.publicMetadata?.role === 'admin' ? (
                <div className="alert alert-success">
                  <strong>You are already an admin!</strong>
                  <br />
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={() => router.push('/admin')}
                  >
                    Go to Admin Panel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={makeAdmin}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Granting Admin Access...
                    </>
                  ) : (
                    'Make Me Admin'
                  )}
                </button>
              )}

              <div className="mt-4">
                <h6>What this does:</h6>
                <ul>
                  <li>Updates your Clerk profile to have admin role</li>
                  <li>Gives you access to admin panel at <code>/admin</code></li>
                  <li>Allows you to manage other users at <code>/admin/users</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
