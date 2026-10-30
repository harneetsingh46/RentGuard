import React, { useState } from "react";
import { Link } from "react-router-dom";

const Maintenance = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "Medium",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Connect this form to your backend API to save complaints.
    console.log("Complaint details:", formData);
    console.log("Attached image:", image);

    setMessage(
      "Your complaint form is ready. Connect the backend API to submit it."
    );
  };

  const inputClass =
    "mt-2 w-full rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#f9c83d] focus:ring-2 focus:ring-[#f9c83d]/20 dark:border-neutral-700 dark:bg-[#1d1d1d] dark:text-[#F1F0ED]";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Tenant Portal / Maintenance
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Maintenance & Complaints
            </h1>

            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Report a maintenance issue or submit a complaint to your property
              manager.
            </p>
          </div>

          <Link
            to="/tenant/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xs border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Information Card */}
        <div className="mb-6 flex gap-4 rounded-xs border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
            !
          </div>

          <div>
            <h2 className="font-semibold">Need something fixed?</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Describe the issue clearly so your property manager can
              understand what needs attention. For urgent safety issues,
              contact the appropriate emergency service directly.
            </p>
          </div>
        </div>

        {/* Complaint Form */}
        <section className="rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="border-b border-neutral-100 p-6 dark:border-neutral-800 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">
              File a Complaint
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Fill in the details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-7">
            {/* Complaint Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Complaint Title *
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Water leakage in bathroom"
                className={inputClass}
                required
                maxLength={120}
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Complaint Category *
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Structural">Structural Damage</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Noise">Noise Complaint</option>
                  <option value="Security">Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className={labelClass}>
                  Priority *
                </label>

                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelClass}>
                Complaint Description *
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue, where it occurred, and when you noticed it..."
                rows={5}
                maxLength={2000}
                className={`${inputClass} resize-y`}
                required
              />

              <p className="mt-1 text-right text-xs text-neutral-400">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="image" className={labelClass}>
                Attach Image{" "}
                <span className="font-normal text-neutral-400">
                  (Optional)
                </span>
              </label>

              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];

                  if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
                    setMessage("Please select an image smaller than 5 MB.");
                    e.target.value = "";
                    setImage(null);
                    return;
                  }

                  setMessage("");
                  setImage(selectedFile || null);
                }}
                className={`${inputClass} file:mr-4 file:rounded-xs file:border-0 file:bg-[#f9c83d] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black`}
              />

              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                PNG, JPG, or WebP. Maximum size: 5 MB.
              </p>

              {image && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Selected: {image.name}
                </p>
              )}
            </div>

            {/* Form Message */}
            {message && (
              <div
                role="status"
                className="rounded-xs border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800 sm:flex-row sm:justify-end">
              <Link
                to="/tenant/dashboard"
                className="inline-flex items-center justify-center rounded-xs border border-neutral-200 px-6 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
              >
                Submit Complaint
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </section>

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Maintenance
        </footer>
      </div>
    </div>
  );
};

export default Maintenance;