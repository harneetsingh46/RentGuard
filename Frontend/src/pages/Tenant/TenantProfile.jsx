
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const TenantProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/tenant/me");
      const tenant = response.data.data;

      setProfile(tenant);
      setFormData({
        fullName: tenant.fullName || "",
        address: tenant.address || "",
      });

      setPicturePreview(tenant.profilePicture || "");
    } catch (err) {
      console.error("Tenant profile error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-sm border border-neutral-200 bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#f9c83d] focus:ring-2 focus:ring-[#f9c83d]/20 dark:border-neutral-700 dark:bg-[#1d1d1d] dark:text-[#F1F0ED]";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-300";

  const openModal = () => {
    setFormData({
      fullName: profile.fullName || "",
      address: profile.address || "",
    });
    setError("");
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setProfilePicture(file);
    setPicturePreview(URL.createObjectURL(file));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.fullName.trim() || !formData.address.trim()) {
      setError("Full name and address are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient.put("/tenant/me/update", {
        fullName: formData.fullName.trim(),
        address: formData.address.trim(),
      });

      const updatedTenant = response.data.data;

      setProfile((prev) => ({
        ...prev,
        ...updatedTenant,
      }));

      setFormData({
        fullName: updatedTenant.fullName,
        address: updatedTenant.address,
      });

      setIsModalOpen(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async () => {
    if (!profilePicture) {
      setError("Please select an image first.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formDataToSend = new FormData();
      formDataToSend.append("image", profilePicture);

      const response = await apiClient.post(
        "/tenant/me/profile-picture",
        formDataToSend,
      );

      const imageUrl = response.data.data.profilePicture;

      setProfile((prev) => ({
        ...prev,
        profilePicture: imageUrl,
      }));

      setPicturePreview(imageUrl);
      setProfilePicture(null);
      setMessage("Profile picture updated successfully.");
    } catch (err) {
      console.error("Profile picture upload error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to upload profile picture.",
      );
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.fullName || "Tenant")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] dark:bg-[#101010]">
        <p className="text-sm text-neutral-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f5f0] p-6 dark:bg-[#101010]">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="rounded-sm bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black"
        >
          Try again
        </button>
      </div>
    );
  }

  const maskedAadhaar = profile?.aadhaarNumber || "";

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Tenant Portal / Profile
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              View and manage your personal account information.
            </p>
          </div>

          <Link
            to="/tenant/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-sm border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="flex flex-col justify-between gap-6 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-[#f7f5f0] text-2xl font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-[#242424]">
                {picturePreview ? (
                  <img
                    src={picturePreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  {profile?.fullName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Tenant Account
                </p>
                <p className="mt-1 break-all text-sm text-neutral-500 dark:text-neutral-400">
                  {profile?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              ✎ Update Profile
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-base font-semibold">
                Personal Details
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your registered contact and identification information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Full Name
                </p>
                <p className="mt-2 font-medium">
                  {profile?.fullName || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Email Address
                </p>
                <p className="mt-2 break-all font-medium">
                  {profile?.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Phone Number
                </p>
                <p className="mt-2 font-medium">
                  {profile?.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Aadhaar Number
                </p>
                <p className="mt-2 font-medium tracking-wider">
                  {maskedAadhaar || "Not available"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Address
                </p>
                <p className="mt-2 font-medium">
                  {profile?.address || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-[#1d1d1d] sm:px-8">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your personal information should be kept secure and up to date.
            </p>
          </div>
        </section>

        {message && (
          <p
            role="status"
            className="mt-4 rounded-sm border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300"
          >
            {message}
          </p>
        )}

        {error && profile && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · My Profile
        </footer>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving && !uploading) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#171717]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
              <div>
                <h2
                  id="profile-modal-title"
                  className="text-xl font-semibold"
                >
                  Update Profile
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Update your personal information and profile picture.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving || uploading}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-7">
              <div>
                <h3 className="font-semibold">Profile Picture</h3>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#f7f5f0] font-semibold text-neutral-500 dark:bg-[#242424]">
                    {picturePreview ? (
                      <img
                        src={picturePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <label className="cursor-pointer rounded-sm border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                    Choose Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePictureChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handlePictureUpload}
                    disabled={!profilePicture || uploading}
                    className="rounded-sm bg-[#f9c83d] px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Picture"}
                  </button>

                  <span className="text-xs text-neutral-500">
                    Max 5 MB
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Personal Information</h3>

                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleProfileChange}
                      className={inputClass}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      value={profile?.email || ""}
                      className={inputClass}
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      value={profile?.phone || ""}
                      className={inputClass}
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="aadhaar" className={labelClass}>
                      Aadhaar Number
                    </label>
                    <input
                      id="aadhaar"
                      value={maskedAadhaar}
                      className={inputClass}
                      readOnly
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className={labelClass}>
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleProfileChange}
                      className={inputClass}
                      required
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving || uploading}
                  className="rounded-sm border border-neutral-200 px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-sm bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantProfile;
