import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function UsersManagement() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Redirect if not signed in or not admin
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    
    if (isLoaded && isSignedIn && user?.publicMetadata?.role !== 'admin') {
      toast.error('Admin access required');
      router.replace('/');
      return;
    }
  }, [isLoaded, isSignedIn, user, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (clerkId, newRole) => {
    try {
      setUpdating(clerkId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, role: newRole })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message);
        // Update local state
        setUsers(users.map(u => 
          u.clerkId === clerkId 
            ? { ...u, role: newRole }
            : u
        ));
      } else {
        toast.error(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.publicMetadata?.role === 'admin') {
      fetchUsers();
    }
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        
        .full-width-container {
          width: 100vw;
          padding: 1rem;
          margin: 0;
          max-width: none;
        }
        
        .full-width-wrapper {
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        @media (max-width: 768px) {
          .full-width-container {
            padding: 0.5rem !important;
            margin: 0 !important;
            width: 100vw !important;
          }
          
          .mobile-header {
            flex-direction: column !important;
            gap: 1rem;
            padding: 0 0.5rem !important;
            width: 100% !important;
          }
          
          .mobile-header h2 {
            font-size: 1.5rem !important;
            margin-bottom: 0 !important;
            text-align: center;
          }
          
          .mobile-header .btn {
            align-self: center;
            width: auto;
            min-width: 150px;
          }
          
          .user-card {
            margin-bottom: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            width: calc(100vw - 1rem) !important;
            max-width: none !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .user-card-header {
            background-color: #f8f9fa;
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            width: 100% !important;
          }
          
          .user-info h6 {
            margin-bottom: 0.25rem;
            color: #333;
            font-weight: 600;
          }
          
          .user-email {
            color: #6c757d;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
          }
          
          .user-id {
            color: #6c757d;
            font-size: 0.75rem;
            font-family: monospace;
          }
          
          .user-card-body {
            padding: 1rem;
            width: 100% !important;
          }
          
          .profile-section {
            margin-bottom: 1rem;
          }
          
          .profile-section h6 {
            color: #495057;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            display: block !important;
            visibility: visible !important;
          }
          
          .profile-details {
            background-color: #f8f9fa;
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            border: 1px solid #e9ecef;
            display: block !important;
            visibility: visible !important;
          }
          
          .profile-details div {
            margin-bottom: 0.25rem;
            color: #212529 !important;
            display: block !important;
            visibility: visible !important;
            line-height: 1.4;
          }
          
          .profile-details div:last-child {
            margin-bottom: 0;
          }
          
          .profile-details strong {
            color: #495057 !important;
            font-weight: 600;
          }
          
          .profile-details .text-muted {
            color: #6c757d !important;
            font-style: italic;
          }
          
          .role-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #dee2e6;
          }
          
          .role-badge {
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .role-admin {
            background-color: #dc3545;
            color: white;
          }
          
          .role-user {
            background-color: #198754;
            color: white;
          }
          
          .action-btn {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid;
            transition: all 0.2s;
          }
          
          .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .btn-make-admin {
            background-color: #dc3545;
            border-color: #dc3545;
            color: white;
          }
          
          .btn-make-admin:hover:not(:disabled) {
            background-color: #c82333;
            border-color: #bd2130;
          }
          
          .btn-remove-admin {
            background-color: #198754;
            border-color: #198754;
            color: white;
          }
          
          .btn-remove-admin:hover:not(:disabled) {
            background-color: #157347;
            border-color: #146c43;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
        
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
        
        .info-section {
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        
        @media (max-width: 576px) {
          .full-width-container {
            padding: 0.25rem !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: none !important;
            box-sizing: border-box;
          }
          
          .mobile-only {
            width: 100% !important;
            padding: 0.25rem !important;
            margin: 0 !important;
          }
          
          .info-section {
            padding: 1rem;
            margin: 0.25rem !important;
            width: calc(100vw - 0.5rem) !important;
          }
          
          .info-section h4 {
            font-size: 1.25rem;
          }
          
          .info-section ul {
            padding-left: 1rem;
          }
          
          .user-card {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
            width: calc(100vw - 0.5rem) !important;
            max-width: none !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .profile-section {
            margin-bottom: 1.5rem !important;
          }
          
          .profile-section h6 {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
            color: #333 !important;
          }
          
          .profile-details {
            padding: 1rem !important;
            background-color: #ffffff !important;
            border: 2px solid #e9ecef !important;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
            width: 100% !important;
          }
          
          .profile-details div {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
            color: #000 !important;
          }
        }
      `}</style>
      
      <div className="full-width-container">
        <div className="d-flex justify-content-between align-items-center mb-4 mobile-header">
          <h2>User Management</h2>
          <button 
            className="btn btn-outline-primary"
            onClick={() => router.push('/admin')}
          >
            ← Back to Admin
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
            <p className="mt-3 text-muted">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-muted">
                Total Users: <span className="text-primary">{users.length}</span>
              </h5>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="fas fa-users fa-3x text-muted"></i>
                </div>
                <p className="text-muted mb-0 fs-5">No users found</p>
                <p className="text-muted">Users will appear here once they sign up</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="desktop-only">
                  <div className="card">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>User Info</th>
                            <th>Profile Data</th>
                            <th>Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((userData) => (
                            <tr key={userData.clerkId}>
                              <td>
                                <div>
                                  <strong>{userData.fullName || 'Unknown'}</strong>
                                  <br />
                                  <small className="text-muted">{userData.email}</small>
                                  <br />
                                  <small className="text-muted">ID: {userData.clerkId}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{userData.profileData?.name || 'No profile'}</strong>
                                  {userData.profileData && (
                                    <>
                                      <br />
                                      <small>
                                        {userData.profileData.city}, Age: {userData.profileData.age}
                                      </small>
                                      <br />
                                      <small>
                                        {userData.profileData.degree} • {userData.profileData.phone}
                                      </small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  userData.role === 'admin' 
                                    ? 'bg-danger' 
                                    : 'bg-success'
                                }`}>
                                  {userData.role || 'user'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={`btn btn-sm ${
                                    userData.role === 'admin' 
                                      ? 'btn-outline-success' 
                                      : 'btn-outline-danger'
                                  }`}
                                  disabled={updating === userData.clerkId}
                                  onClick={() => updateUserRole(
                                    userData.clerkId, 
                                    userData.role === 'admin' ? 'user' : 'admin'
                                  )}
                                >
                                  {updating === userData.clerkId ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    userData.role === 'admin' ? 'Remove Admin' : 'Make Admin'
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="mobile-only">
                  {users.map((userData) => (
                    <div key={userData.clerkId} className="user-card">
                      <div className="user-card-header">
                        <div className="user-info">
                          <h6>{userData.fullName || 'Unknown User'}</h6>
                          <div className="user-email">{userData.email}</div>
                          <div className="user-id">{userData.clerkId}</div>
                        </div>
                        <div className={`role-badge ${userData.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                          {userData.role || 'user'}
                        </div>
                      </div>
                      
                      <div className="user-card-body">
                        <div className="profile-section">
                          <h6>Profile Information</h6>
                          {userData.profileData ? (
                            <div className="profile-details">
                              {userData.profileData.name && (
                                <div><strong>Name:</strong> {userData.profileData.name}</div>
                              )}
                              {userData.profileData.city && (
                                <div><strong>City:</strong> {userData.profileData.city}</div>
                              )}
                              {userData.profileData.age && (
                                <div><strong>Age:</strong> {userData.profileData.age}</div>
                              )}
                              {userData.profileData.degree && (
                                <div><strong>Degree:</strong> {userData.profileData.degree}</div>
                              )}
                              {userData.profileData.phone && (
                                <div><strong>Phone:</strong> {userData.profileData.phone}</div>
                              )}
                              {!userData.profileData.name && !userData.profileData.city && 
                               !userData.profileData.age && !userData.profileData.degree && 
                               !userData.profileData.phone && (
                                <div className="text-muted">Profile data exists but no details available</div>
                              )}
                            </div>
                          ) : (
                            <div className="profile-details">
                              <div className="text-muted">No profile data available</div>
                            </div>
                          )}
                        </div>

                        <div className="role-section">
                          <span className="fw-semibold">Role Management:</span>
                          <button
                            className={`action-btn ${
                              userData.role === 'admin' 
                                ? 'btn-remove-admin' 
                                : 'btn-make-admin'
                            }`}
                            disabled={updating === userData.clerkId}
                            onClick={() => updateUserRole(
                              userData.clerkId, 
                              userData.role === 'admin' ? 'user' : 'admin'
                            )}
                          >
                            {updating === userData.clerkId ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Updating...
                              </>
                            ) : (
                              userData.role === 'admin' ? 'Remove Admin' : 'Make Admin'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="info-section">
          <h4 className="text-primary mb-3">MongoDB Data Structure</h4>
          <div className="alert alert-light border-0">
            <p className="mb-3"><strong>Understanding your data with Clerk authentication:</strong></p>
            <ul className="mb-0">
              <li className="mb-2"><strong>User Authentication:</strong> Handled by Clerk (not stored in your MongoDB)</li>
              <li className="mb-2"><strong>Profile Data:</strong> Stored in your MongoDB <code>forms</code> collection</li>
              <li className="mb-2"><strong>User Roles:</strong> Stored in Clerk's <code>publicMetadata.role</code></li>
              <li><strong>User IDs:</strong> Clerk provides string IDs like <code>user_xxx</code></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
