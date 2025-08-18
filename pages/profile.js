import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/forms`);
        if (!res.ok) throw new Error("Failed to load user data");

        const data = await res.json();
        const form = data.forms?.[0];

        if (!form) {
          setUserData(null);
          setFormData({
            name: user.fullName || user.firstName || "",
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
  }, [isLoaded, isSignedIn, user?.id]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditToggle = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setFormData(userData || {});
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.city || !formData.degree || !formData.age) {
      toast.error("All fields are required");
      return;
    }

    const payload = {
      ...formData,
      avatarUrl: avatarPreview,
    };

    try {
      let res = await fetch("/api/forms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = await res.json();

      if (!res.ok && data.message === "Form not found") {
        res = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.message || "Update failed");

      setUserData(data.form);
      setEditing(false);
      toast.success("Profile saved");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Update failed");
    }
  };

  const handleAvatarUpload = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("Please sign in to upload avatar.");
      return;
    }
    if (!avatarFile) return toast.error("Please choose a file");

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", avatarFile);
    formDataUpload.append("email", user.emailAddresses?.[0]?.emailAddress || "");
    if (userData?.avatarPublicId) {
      formDataUpload.append("oldPublicId", userData.avatarPublicId);
    }

    setUploading(true);
    try {
      // First, upload the avatar to Cloudinary
      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success("Avatar uploaded");

      // Prepare profile data with avatar info
      const profileData = {
        name: formData.name || user.fullName || user.firstName || "",
        phone: formData.phone || "",
        city: formData.city || "",
        degree: formData.degree || "",
        age: formData.age || "",
        avatarUrl: data.url,
        avatarPublicId: data.public_id,
      };

      // Try to update existing profile first (PUT)
      let saveRes = await fetch("/api/forms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      let saveData = await saveRes.json();

      // If profile doesn't exist (404), create a new one (POST)
      if (!saveRes.ok && saveData.message === "Form not found") {
        saveRes = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });
        saveData = await saveRes.json();
        
        if (saveRes.ok) {
          toast.success("Profile created and avatar saved!");
        }
      } else if (saveRes.ok) {
        toast.success("Avatar updated successfully!");
      }

      if (!saveRes.ok) throw new Error(saveData.message || "Save failed");

      setAvatarPreview(data.url);
      setUserData(saveData.form);
      setFormData(saveData.form);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <main className="page-shell d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </main>
    );
  }

  // Don't render if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <main className="page-shell d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="profile-container">
        <div className="profile-card animate-fade-up">
          <div className="profile-header">
            {/* Avatar — Next/Image for sharper rendering */}
            <div className="avatar-ring">
              <Image
                src={avatarPreview || "/avatar.png"}
                alt="avatar"
                width={160}
                height={160}
                className="profile-avatar avatar-sharp"
                priority
              />
            </div>

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
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                className="avatar-file-input"
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
    </main>
  );
}
