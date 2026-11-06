
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../ApiClient/interceptor";

const OwnerProfile = () => {
  const { user, setUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync form data with authenticated user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
      });
    }
  }, [user]);

  const inputClass =
    "mt-2 w-full min-w-0 rounded-sm border border-neutral-200 bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#f9c83d] focus:ring-2 focus:ring-[#f9c83d]/20 dark:border-neutral-700 dark:bg-[#1d1d1d] dark:text-[#F1F0ED]";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-300";

  // Profile details
  const displayName = user?.fullName || user?.username || "Owner";
  const username = user?.username || "";
  const email = user?.email || "Not available";
  const phone = user?.phone || "Not available";

  // Check whether username has changed
  const normalizedUsername = formData.username.trim().toLowerCase();

  const hasUsernameChanged =
    normalizedUsername !== (user?.username || "").toLowerCase();

  // Profile initials
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  // Open modal
  const openModal = () => {
    setFormData({
      username: user?.username || "",
    });

    setError("");
    setMessage("");
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setError("");
  };

  // Handle input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const updatedUsername = formData.username.trim().toLowerCase();

    if (!updatedUsername) {
      setError("Username cannot be empty.");
      return;
    }

    if (
      updatedUsername.length < 3 ||
      updatedUsername.length > 30
    ) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    // No API request if nothing changed
    if (!hasUsernameChanged) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await apiClient.put("/user/update-profile", {
        username: updatedUsername,
      });

      const updatedUser = response.data.data;

      // Update global authentication state
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      setMessage("Profile updated successfully.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] dark:bg-[#101010]">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Owner Portal / Profile
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              View and manage your personal account information.
            </p>
          </div>

          <Link
            to="/owner/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-sm border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">

          {/* Profile Overview */}
          <div className="flex flex-col justify-between gap-6 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-[#f7f5f0] text-2xl font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-[#242424] dark:text-neutral-300">
                {initials}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Owner Account
                </p>

                <p className="mt-1 break-all text-sm text-neutral-500 dark:text-neutral-400">
                  {email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">✎</span>
              Update Profile
            </button>
          </div>

          {/* Personal Details */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-base font-semibold">
                Personal Details
              </h3>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your registered contact and account information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Full Name
                </p>
                <p className="mt-2 font-medium">{displayName}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Username
                </p>
                <p className="mt-2 font-medium">@{username}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Email Address
                </p>
                <p className="mt-2 break-all font-medium">{email}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Phone Number
                </p>
                <p className="mt-2 font-medium">{phone}</p>
              </div>

            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-[#1d1d1d] sm:px-8">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Email and phone changes require OTP verification.
            </p>
          </div>
        </section>

        {/* Success Message */}
        {message && (
          <p
            role="status"
            className="mt-4 rounded-sm border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300"
          >
            {message}
          </p>
        )}

        {/* Page Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Owner Portal · My Profile
        </footer>
      </div>

      {/* Update Profile Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#171717]"
          >

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-5 dark:border-neutral-800 dark:bg-[#171717] sm:px-8">
              <div>
                <h2
                  id="profile-modal-title"
                  className="text-xl font-semibold"
                >
                  Update Profile
                </h2>

                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Update your account username.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-7 p-6 sm:p-8"
            >

              {/* Personal Information */}
              <div>
                <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                  Personal Information
                </h3>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">

                  {/* Username */}
                  <div className="w-full min-w-0 flex-1">
                    <label
                      htmlFor="username"
                      className={labelClass}
                    >
                      Username
                    </label>

                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleProfileChange}
                      className={inputClass}
                      required
                      minLength={3}
                      maxLength={30}
                      autoComplete="username"
                    />
                  </div>

                  {/* Email */}
                  <div className="w-full min-w-0 flex-1">
                    <label
                      htmlFor="email"
                      className={labelClass}
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      className={`${inputClass} cursor-not-allowed opacity-70`}
                      readOnly
                    />
                  </div>

                  {/* Phone */}
                  <div className="w-full min-w-0 flex-1">
                    <label
                      htmlFor="phone"
                      className={labelClass}
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      className={`${inputClass} cursor-not-allowed opacity-70`}
                      readOnly
                    />
                  </div>

                </div>
              </div>

              {/* Information Note */}
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-[#1d1d1d]">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Email and phone number cannot currently be changed.
                  A separate OTP verification process will be required
                  to update either contact.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <p
                  role="alert"
                  className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-sm border border-neutral-200 px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !hasUsernameChanged}
                  className="rounded-sm bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;
