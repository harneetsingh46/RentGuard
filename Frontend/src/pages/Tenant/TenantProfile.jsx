import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TenantProfile = () => {
  const [profile, setProfile] = useState({
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "9876543210",
    aadhaar: "123456789012",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (picturePreview) URL.revokeObjectURL(picturePreview);
    };
  }, [picturePreview]);

  const inputClass =
    "mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#f9c83d] focus:ring-2 focus:ring-[#f9c83d]/20 dark:border-neutral-700 dark:bg-[#1d1d1d] dark:text-[#F1F0ED]";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-300";

  const openModal = () => {
    setFormData(profile);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMessage("");
    setError("");
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
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      return;
    }

    if (picturePreview) URL.revokeObjectURL(picturePreview);

    const preview = URL.createObjectURL(file);
    setProfilePicture(file);
    setPicturePreview(preview);
    setError("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{12}$/.test(formData.aadhaar)) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    const wantsPasswordChange =
      passwordData.currentPassword ||
      passwordData.newPassword ||
      passwordData.confirmPassword;

    if (wantsPasswordChange) {
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        setError("Fill in all three password fields to change your password.");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError("Your new password must contain at least 8 characters.");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Your new password and confirmation do not match.");
        return;
      }
    }

    setProfile(formData);
    setMessage("Profile details saved in this demo.");

    // Backend integration is needed to persist profile changes,
    // upload the picture, or actually change the account password.
    setIsModalOpen(false);
  };

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
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
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Profile Overview */}
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

              <div>
                <h2 className="text-xl font-semibold">{profile.fullName}</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Tenant Account
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {profile.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">✎</span>
              Update Profile
            </button>
          </div>

          {/* Read-only Details */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-base font-semibold">Personal Details</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your registered contact and identification information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Full Name
                </p>
                <p className="mt-2 font-medium">{profile.fullName}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Email Address
                </p>
                <p className="mt-2 break-all font-medium">{profile.email}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Phone Number
                </p>
                <p className="mt-2 font-medium">{profile.phone}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Aadhaar Number
                </p>
                <p className="mt-2 font-medium tracking-wider">
                  {"•".repeat(8) + profile.aadhaar.slice(-4)}
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
            className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300"
          >
            {message}
          </p>
        )}

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · My Profile
        </footer>
      </div>

      {/* Update Profile Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
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
                  Edit your details and account security.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-7">
              {/* Picture Upload */}
              <div>
                <h3 className="font-semibold">Profile Picture</h3>

                <div className="mt-4 flex items-center gap-4">
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

                  <label className="cursor-pointer rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                    Choose Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePictureChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-neutral-500">
                    Max 5 MB
                  </span>
                </div>
              </div>

              {/* Personal Information */}
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
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      className={inputClass}
                      required
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label htmlFor="aadhaar" className={labelClass}>
                      Aadhaar Number
                    </label>
                    <input
                      id="aadhaar"
                      name="aadhaar"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      value={formData.aadhaar}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          aadhaar: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 12),
                        }))
                      }
                      className={inputClass}
                      required
                      maxLength={12}
                      pattern="[0-9]{12}"
                    />
                  </div>
                </div>
              </div>

              {/* Password Update */}
              <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
                <h3 className="font-semibold">Update Password</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Leave these fields empty if you don't want to change your password.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className={labelClass}
                    >
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="newPassword" className={labelClass}>
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className={labelClass}
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-neutral-200 px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] dark:hover:bg-[#edbb2e]"
                >
                  Save Changes
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