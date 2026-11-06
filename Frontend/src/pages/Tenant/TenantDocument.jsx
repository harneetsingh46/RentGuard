import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "").replace(/\/$/, "");

const DOCUMENTS_ENDPOINT = `${API_BASE_URL}/document`;

const getAuthToken = () => {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (directToken) return directToken;

  // Support projects that store the authenticated user object instead.
  for (const key of ["user", "userInfo", "auth"]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      const token = value?.token || value?.accessToken;
      if (token) return token;
    } catch {
      // Ignore values that are not JSON.
    }
  }

  return null;
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return (
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Request failed (${response.status})`
    );
  } catch {
    return `Request failed (${response.status})`;
  }
};

const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set(
      "Authorization",
      token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    );
  }

  // Do not set Content-Type for FormData; the browser adds its boundary.
  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${DOCUMENTS_ENDPOINT}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
};

const unwrapDocuments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.documents)) return payload.documents;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.documents)) return payload.data.documents;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getDocumentId = (document) =>
  document?._id || document?.id || document?.documentId;

const getDocumentCategory = (document) => {
  const type = String(document?.documentType || document?.type || "").toLowerCase();
  const name = `${document?.documentName || ""} ${document?.originalFileName || ""}`.toLowerCase();

  if (type === "agreement" || type === "lease" || type === "rental agreement") {
    return "Lease";
  }

  if (name.includes("receipt") || type === "receipt" || type === "lease") {
    return "Lease";
  }

  return "Other";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDownloadUrl = (payload) =>
  payload?.downloadUrl ||
  payload?.url ||
  payload?.secureUrl ||
  payload?.data?.downloadUrl ||
  payload?.data?.url ||
  payload?.data?.secureUrl ||
  payload?.result?.downloadUrl ||
  payload?.result?.url;

const TenantDocument = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("agreement");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/documents");
      const payload = await response.json();
      setDocuments(unwrapDocuments(payload));
    } catch (requestError) {
      setError(requestError.message || "Unable to load your documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filters = ["All", "Lease", "Other"];

  const filteredDocuments = useMemo(
    () =>
      activeFilter === "All"
        ? documents
        : documents.filter(
            (document) => getDocumentCategory(document) === activeFilter,
          ),
    [activeFilter, documents],
  );

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Please choose a document to upload.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (selectedFile.type && !allowedTypes.includes(selectedFile.type)) {
      setError("Only PDF, JPG, PNG, and WEBP files are supported.");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append(
      "documentName",
      documentName.trim() || selectedFile.name.replace(/\.[^.]+$/, ""),
    );
    formData.append("documentType", documentType);

    setUploading(true);

    try {
      await apiRequest("/upload", {
        method: "POST",
        body: formData,
      });

      setDocumentName("");
      setDocumentType("agreement");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Your document was uploaded successfully.");
      await loadDocuments();
    } catch (requestError) {
      setError(requestError.message || "Unable to upload your document.");
    } finally {
      setUploading(false);
    }
  };

  const openOrDownloadDocument = async (document, mode) => {
    const documentId = getDocumentId(document);
    if (!documentId) {
      setError("This document does not have a valid document ID.");
      return;
    }

    setError("");
    setSuccess("");
    setOpeningDocumentId(documentId);

    // Open a blank tab immediately so browsers do not block it after the API call.
    const newTab = mode === "view" ? window.open("about:blank", "_blank") : null;

    try {
      const response = await apiRequest(
        `/documents/${encodeURIComponent(documentId)}/download`,
      );

      const contentType = response.headers.get("content-type") || "";
      let fileUrl = "";

      if (contentType.includes("application/json")) {
        const payload = await response.json();
        fileUrl = getDownloadUrl(payload);
      } else {
        // Also support controllers that stream or redirect the file directly.
        const blob = await response.blob();
        fileUrl = URL.createObjectURL(blob);
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      }

      if (!fileUrl) {
        throw new Error("The server did not return a document download URL.");
      }

      if (mode === "view") {
        if (newTab) {
          newTab.opener = null;
          newTab.location.href = fileUrl;
        } else {
          window.location.href = fileUrl;
        }
      } else {
        const link = window.document.createElement("a");
        link.href = fileUrl;
        link.download =
          document.originalFileName ||
          document.documentName ||
          documentName ||
          "tenant-document";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (requestError) {
      if (newTab) newTab.close();
      setError(requestError.message || "Unable to open this document.");
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const leaseCount = documents.filter(
    (document) => getDocumentCategory(document) === "Lease",
  ).length;
  const otherCount = documents.filter(
    (document) => getDocumentCategory(document) !== "Lease",
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Tenant Portal / Documents
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Documents
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              View, upload, and download your rental documents in one place.
            </p>
          </div>

          <Link
            to="/tenant/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xs border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-[#171717] dark:text-yellow-300 dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Feedback */}
        {/* {error && (
          <div
            role="alert"
            className="mb-5 rounded-xs border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        )} */}
        {/* {success && (
          <div
            role="status"
            className="mb-5 rounded-xs border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
          >
            {success}
          </div>
        )} */}

        {/* Summary Cards
        <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Documents</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {documents.length}
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
                ▤
              </div>
            </div>
            <div className="mt-7 border-t border-white/10 pt-4">
              <p className="text-xs text-neutral-400">
                All your rental documents
              </p>
            </div>
          </div>

          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Lease Documents
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {leaseCount}
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-[#171717] text-xl text-yellow-300">
                ▧
              </div>
            </div>
            <p className="mt-7 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Rental agreements and lease files
            </p>
          </div>

          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Other Documents
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {otherCount}
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-green-50 text-xl text-green-700 dark:bg-green-400/10 dark:text-green-400">
                ✓
              </div>
            </div>
            <p className="mt-7 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Lease and other rental files
            </p>
          </div>
        </section> */}

        {/* Upload Document */}
        <section className="mb-6 rounded-xs border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Upload a Document
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Upload a PDF or image to keep it with your tenancy documents.
            </p>
          </div>

          <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Document name
              </span>
              <input
                type="text"
                value={documentName}
                onChange={(event) => setDocumentName(event.target.value)}
                maxLength={100}
                placeholder="e.g. Rental agreement"
                className="w-full rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-500 dark:border-neutral-700 dark:bg-[#101010]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Document type
              </span>
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="w-full rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-500 dark:border-neutral-700 dark:bg-[#101010]"
              >
                <option value="agreement">Lease / Agreement</option>
                <option value="ownership">Ownership</option>
                <option value="tax">Tax</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium">
                Choose file
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
                className="block w-full rounded-xs border border-neutral-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-xs file:border-0 file:bg-[#f9c83d] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black dark:border-neutral-700 dark:bg-[#101010]"
              />
              <span className="mt-2 block text-xs text-neutral-500 dark:text-neutral-400">
                Supported formats: PDF, JPG, JPEG, PNG, WEBP.
              </span>
            </label>

            {selectedFile && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 md:col-span-2">
                Selected: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center justify-center rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </section>

        {/* Document List */}
        <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-7">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                All Documents
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your rental agreements, Lease, and other files.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xs px-4 py-2 text-xs font-medium transition ${
                    activeFilter === filter
                      ? "bg-[#141414] text-white dark:bg-[#f9c83d] dark:text-black"
                      : "border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#faf9f6] dark:bg-[#1d1d1d]">
                <tr className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <th className="px-6 py-4 font-medium sm:px-7">
                    Document Name
                  </th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Uploaded Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-sm text-neutral-500"
                    >
                      Loading your documents...
                    </td>
                  </tr>
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => {
                    const id = getDocumentId(document);
                    const isOpening = openingDocumentId === id;
                    const name =
                      document.documentName ||
                      document.originalFileName ||
                      "Untitled document";
                    const category = getDocumentCategory(document);

                    return (
                      <tr
                        key={id || name}
                        className="border-t border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-[#1d1d1d]"
                      >
                        <td className="px-6 py-5 font-medium sm:px-7">
                          <div>{name}</div>
                          {document.originalFileName &&
                            document.originalFileName !== name && (
                              <div className="mt-1 text-xs font-normal text-neutral-400">
                                {document.originalFileName}
                              </div>
                            )}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                          {category}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(document.createdAt || document.updatedAt)}
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-xs bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400">
                            Available
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              disabled={!id || isOpening}
                              onClick={() =>
                                openOrDownloadDocument(document, "view")
                              }
                              className="text-sm font-medium text-neutral-800 underline underline-offset-4 hover:text-yellow-600 disabled:opacity-50 dark:text-yellow-300"
                            >
                              {isOpening ? "Opening..." : "View"}
                            </button>
                            <button
                              type="button"
                              disabled={!id || isOpening}
                              onClick={() =>
                                openOrDownloadDocument(document, "download")
                              }
                              className="text-sm font-medium text-neutral-800 underline underline-offset-4 hover:text-yellow-600 disabled:opacity-50 dark:text-yellow-300"
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center sm:px-7">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xs bg-[#f7f5f0] text-2xl text-neutral-500 dark:bg-[#222222] dark:text-neutral-300">
                        ▤
                      </div>
                      <h3 className="mt-4 font-semibold">
                        {activeFilter === "All"
                          ? "No documents found"
                          : `No ${activeFilter.toLowerCase()} documents found`}
                      </h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                        Your rental documents will appear here once they are
                        uploaded or shared by your property manager.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800 sm:px-7">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>
        </section>

        {/* Information Cards */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-4xl bg-[#f9c83d] text-xl text-black">
                !
              </div>
              <div>
                <h3 className="font-semibold">Keep Your Documents Safe</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Keep copies of your rental agreement, lease, and other
                  important rental documents for your records.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <h3 className="font-semibold">Need Help?</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              If a document is missing or you have questions about a rental
              file, contact your property manager.
            </p>
            <Link
              to="/tenant/profile"
              className="mt-5 inline-flex items-center gap-2 rounded-xs bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              View My Profile
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Documents
        </footer>
      </div>
    </div>
  );
};

export default TenantDocument;
