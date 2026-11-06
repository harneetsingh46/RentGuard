
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";

const Maintenance = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "Medium",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintError, setComplaintError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");

      const response = await apiClient.get(
        "/maintenance/my-complaints"
      );

      const data = response.data?.data;

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setComplaintError(
        error.response?.data?.message ||
          "Unable to load your complaint history."
      );
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("category", formData.category);
      data.append("priority", formData.priority);
      data.append("description", formData.description);

      if (image) {
        data.append("image", image);
      }

      const response = await apiClient.post(
        "/maintenance/complaint",
        data
      );

      setIsSuccess(true);
      setMessage(
        response.data?.message ||
          "Complaint submitted successfully."
      );

      setFormData({
        title: "",
        category: "",
        priority: "Medium",
        description: "",
      });

      setImage(null);

      // Refresh complaint history after submission
      await loadComplaints();

      const imageInput = document.getElementById("image");
      if (imageInput) imageInput.value = "";
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error.response?.data?.message ||
          "Failed to submit complaint. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusStyle = (status) => {
    const styles = {
      Pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
      "In Progress":
        "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300",
      Resolved:
        "bg-green-100 text-green-800 dark:bg-green-400/10 dark:text-green-300",
      Rejected:
        "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
    };

    return styles[status] || "bg-neutral-100 text-neutral-700";
  };

  const priorityStyle = (priority) => {
    const styles = {
      Low: "text-green-600 dark:text-green-400",
      Medium: "text-amber-600 dark:text-amber-400",
      High: "text-red-600 dark:text-red-400",
    };

    return styles[priority] || "text-neutral-500";
  };

  const filteredComplaints =
    statusFilter === "All"
      ? complaints
      : complaints.filter(
          (complaint) => complaint.status === statusFilter
        );

  const counts = {
    total: complaints.length,
    pending: complaints.filter(
      (item) => item.status === "Pending"
    ).length,
    inProgress: complaints.filter(
      (item) => item.status === "In Progress"
    ).length,
    resolved: complaints.filter(
      (item) => item.status === "Resolved"
    ).length,
  };

  const inputClass =
    "mt-2 w-full rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm text-[#171717] outline-none transition focus:border-[#f9c83d] focus:ring-2 focus:ring-[#f9c83d]/20 dark:border-neutral-700 dark:bg-[#1d1d1d] dark:text-[#F1F0ED]";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <div className="min-h-screen w-full bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

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
              Report an issue and track its progress.
            </p>
          </div>

          <Link
            to="/tenant/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xs border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:hover:bg-neutral-800"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Information Card */}
        <div className="mb-6 flex gap-4 rounded-xs border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#171717] sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
            !
          </div>

          <div>
            <h2 className="font-semibold">
              Need something fixed?
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Describe the issue clearly so your property manager
              can understand what needs attention. For urgent safety
              issues, contact the appropriate emergency service directly.
            </p>
          </div>
        </div>

        {/* Submit Complaint */}
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
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];

                  if (
                    selectedFile &&
                    selectedFile.size > 5 * 1024 * 1024
                  ) {
                    setMessage("Please select an image smaller than 5 MB.");
                    setIsSuccess(false);
                    event.target.value = "";
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

            {message && (
              <div
                role="status"
                className={`rounded-xs border p-4 text-sm ${
                  isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800 sm:flex-row sm:justify-end">
              <Link
                to="/tenant/dashboard"
                className="inline-flex items-center justify-center rounded-xs border border-neutral-200 px-6 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
                →
              </button>
            </div>
          </form>
        </section>

        {/* My Complaints */}
        <section className="mt-10 overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                My Complaints
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Track the progress of your submitted complaints.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xs border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-[#101010]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                type="button"
                onClick={loadComplaints}
                disabled={loadingComplaints}
                className="rounded-xs border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                {loadingComplaints ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {complaintError && (
            <div className="m-5 rounded-xs border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {complaintError}
            </div>
          )}

          {loadingComplaints ? (
            <div className="p-12 text-center text-sm text-neutral-500">
              Loading your complaints...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xs bg-[#f7f5f0] text-2xl dark:bg-[#222222]">
                ▤
              </div>

              <h3 className="mt-4 font-semibold">
                {statusFilter === "All"
                  ? "No complaints submitted yet"
                  : `No ${statusFilter} complaints`}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                Your submitted maintenance complaints will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredComplaints.map((complaint) => (
                <article key={complaint._id} className="p-6 sm:p-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {complaint.title}
                        </h3>

                        <span
                          className={`rounded-xs px-3 py-1.5 text-xs font-medium ${statusStyle(complaint.status)}`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {complaint.category} · Submitted{" "}
                        {formatDate(complaint.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <p className="text-xs text-neutral-400">
                        Priority
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${priorityStyle(complaint.priority)}`}>
                        {complaint.priority}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {complaint.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>
                      Property: {complaint.property?.propertyName || "—"}
                    </span>
                    <span>
                      Unit: {complaint.unit?.unitName || "—"}
                    </span>
                    <span>
                      Last updated: {formatDate(complaint.updatedAt)}
                    </span>
                  </div>

                  {complaint.imageUrl && (
                    <a
                      href={complaint.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
                    >
                      View attached image ↗
                    </a>
                  )}

                  {complaint.ownerNotes && (
                    <div className="mt-5 rounded-xs border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Response from property owner
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900 dark:text-blue-100">
                        {complaint.ownerNotes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {filteredComplaints.length} of {complaints.length} complaints
            </p>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Maintenance
        </footer>
      </div>
    </div>
  );
};

export default Maintenance;
