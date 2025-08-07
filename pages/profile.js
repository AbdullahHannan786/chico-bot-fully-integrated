import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function Profile() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/forms?userId=${session.user.id}`);
        if (!res.ok) throw new Error("Failed to load user data");

        const data = await res.json();
        const form = data.forms?.[0];

        if (!form) {
          // New user, no form yet
          setUserData(null);
          setFormData({
            name: session.user.name || "",
            phone: "",
            city: "",
            degree: "",
            age: "",
          });
          setEditing(true);
          setLoading(false);
          return;
        }

        setUserData(form);
        setFormData(form);
        if (form.avatarUrl) setAvatarPreview(form.avatarUrl);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditToggle = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setFormData(userData || {});
  };

 const handleSave = async () => {
  if (
    !formData.name ||
    !formData.phone ||
    !formData.city ||
    !formData.degree ||
    !formData.age
  ) {
    toast.error('All fields are required');
    return;
  }

  const payload = {
    ...formData,
    userId: session.user.id,
    avatarUrl: avatarPreview,
  };

  try {
    // First try PUT (update)
    let res = await fetch('/api/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data = await res.json();

    // If PUT fails due to missing form, fallback to POST
    if (!res.ok && data.message === 'Form not found') {
      res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await res.json();
    }

    if (!res.ok) throw new Error(data.message || 'Update failed');

    setUserData(data.form);
    setEditing(false);
    toast.success('Profile saved');
  } catch (err) {
    console.error('Profile update error:', err);
    toast.error('Update failed');
  }
};


 const handleAvatarUpload = async () => {
  if (!avatarFile) return toast.error('Choose a file first');

  const formDataUpload = new FormData();
  formDataUpload.append('file', avatarFile);
  formDataUpload.append('userId', session.user.id); // ✅ instead of email


  setUploading(true);
  try {
    const res = await fetch('/api/upload-avatar', {
      method: 'POST',
      body: formDataUpload, // ✅ FormData body
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');

    setAvatarPreview(data.url); // ✅ Update preview
    toast.success('Avatar uploaded');
  } catch (err) {
    console.error('Upload error:', err);
    toast.error('Upload failed');
  } finally {
    setUploading(false);
  }
};


  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img
            src={avatarPreview || "/default-avatar.png"}
            alt="avatar"
            className="profile-avatar"
          />

          <div className="profile-info">
            <h2>{formData.name || "Name not set"}</h2>
            <p>
              <strong>Phone:</strong>{" "}
              {editing ? (
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              ) : (
                formData.phone || "Not set"
              )}
            </p>
            <p>
              <strong>City:</strong>{" "}
              {editing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              ) : (
                formData.city || "Not set"
              )}
            </p>
            <p>
              <strong>Degree:</strong>{" "}
              {editing ? (
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                />
              ) : (
                formData.degree || "Not set"
              )}
            </p>
            <p>
              <strong>Age:</strong>{" "}
              {editing ? (
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                />
              ) : formData.age ? (
                `${formData.age} years`
              ) : (
                "Not set"
              )}
            </p>
          </div>
        </div>

        <div className="avatar-upload">
          {editing && (
            <input
              type="file"
              onChange={(e) => setAvatarFile(e.target.files[0])}
            />
          )}

          <div className="profile-buttons">
            {editing ? (
              <>
                <button
                  onClick={handleAvatarUpload}
                  className="upload-btn"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Avatar"}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave}>
                  Save Profile
                </button>
              </>
            ) : (
              <button className="upload-btn" onClick={handleEditToggle}>
                Edit Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
