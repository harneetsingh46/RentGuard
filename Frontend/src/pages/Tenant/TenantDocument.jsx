
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../ApiClient/interceptor";
import { notify } from "../../utils/notify";

const TenantDocument = () => {
  const [documents, setDocuments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadForm, setUploadForm] = useState({
    documentName: "",
    documentType: "other",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch documents uploaded/shared by the owner
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/document/documents");

      setDocuments(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your documents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getDocumentCategory = (document) => {
    const type = document.documentType?.toLowerCase();

    const categories = {
      agreement: "Lease",
      ownership: "Ownership",
      tax: "Tax",
      other: "Other",
    };

    return categories[type] || "Other";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filters = ["All", "Lease", "Ownership", "Tax", "Other"];

  const filteredDocuments = useMemo(() => {
    if (activeFilter === "All") return documents;

    return documents.filter(
      (document) =>
        getDocumentCategory(document) === activeFilter
    );
  }, [documents, activeFilter]);

  // View or download a document shared by the owner
  const handleDocumentAction = async (document, mode) => {
    const documentId = document._id;

    if (!documentId) {
      setError("Invalid document.");
      return;
    }

    setError("");
    setSuccess("");
    setOpeningDocumentId(documentId);

    // Open a tab immediately to avoid popup blockers
    const newTab =
      mode === "view"
        ? window.open("about:blank", "_blank")
        : null;

    try {
      if (mode === "view") {
        const response = await apiClient.get(
          `/document/documents/${documentId}/download`,
          {
            params: { mode: "view", stream: "1" },
            responseType: "blob",
          }
        );

        const isPdf =
          document.fileFormat === "pdf" ||
          (document.originalFileName &&
            document.originalFileName.toLowerCase().endsWith(".pdf"));

        const blob = new Blob([response.data], {
          type: isPdf
            ? "application/pdf"
            : response.data?.type || "application/octet-stream",
        });
        const blobUrl = URL.createObjectURL(blob);

        if (newTab) {
          newTab.opener = null;
          newTab.location.href = blobUrl;
        } else {
          window.location.href = blobUrl;
        }

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      } else {
        const response = await apiClient.get(
          `/document/documents/${documentId}/download`,
          {
            params: {},
          }
        );

        const downloadUrl = response.data?.data?.downloadUrl;

        if (!downloadUrl) {
          throw new Error(
            "The server did not return a document URL."
          );
        }

        const link = window.document.createElement("a");

        link.href = downloadUrl;
        link.download =
          document.originalFileName ||
          document.documentName ||
          "tenant-document";

        link.target = "_blank";
        link.rel = "noopener noreferrer";

        window.document.body.appendChild(link);
        link.click();
        link.remove();

        setSuccess("Your document download has started.");
      }
    } catch (err) {
      if (newTab) newTab.close();

      let errorMessage = "Unable to open this document.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMessage = parsed.message || errorMessage;
        } catch {
          // ignore parse error
        }
      } else {
        errorMessage =
          err.response?.data?.message ||
          err.message ||
          errorMessage;
      }

      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (selectedFile.size > MAX_SIZE) {
      notify.error("File size cannot exceed 5 MB.");
      e.target.value = "";
      setFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const fileName = selectedFile.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!isAllowed) {
      notify.error("Only .pdf, .jpg, .jpeg, .png, and .webp files are allowed.");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadForm.documentName.trim()) {
      notify.error("Document name is required.");
      return;
    }

    if (uploadForm.documentName.trim().length > 100) {
      notify.error("Document name cannot exceed 100 characters.");
      return;
    }

    if (!file) {
      notify.error("Please select a document file.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("documentName", uploadForm.documentName.trim());
      formData.append("documentType", uploadForm.documentType);
      formData.append("document", file);

      await apiClient.post("/document/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      notify.success("Document uploaded successfully.");
      setUploadForm({
        documentName: "",
        documentType: "other",
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadDocuments();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const leaseCount = documents.filter(
    (document) => getDocumentCategory(document) === "Lease"
  ).length;

  const otherCount = documents.length - leaseCount;

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            My Documents
          </h1>

          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Access documents shared with you by your property owner.
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xs border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xs border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
          >
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Total Shared Documents
            </p>

            <h2 className="mt-4 text-3xl font-semibold">
              {documents.length}
            </h2>

            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Documents available in your tenant account
            </p>
          </div>

          <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Lease Documents
            </p>

            <h2 className="mt-4 text-3xl font-semibold">
              {leaseCount}
            </h2>

            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Agreements and lease-related documents
            </p>
          </div>
        </section>

        {/* Upload document */}
        <section className="mb-6 rounded-xs border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <h2 className="text-xl font-semibold tracking-tight">Upload Document</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Upload lease agreements, identification, receipts, or other tenancy documents.
          </p>

          <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Document Name */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Identity Proof / Rent Receipt"
                  value={uploadForm.documentName}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, documentName: e.target.value }))
                  }
                  className="mt-1.5 block w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, documentType: e.target.value }))
                  }
                  className="mt-1.5 block w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-yellow-400 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                >
                  <option value="agreement">Agreement</option>
                  <option value="ownership">Ownership</option>
                  <option value="tax">Tax</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  File (.pdf, .jpg, .jpeg, .png, .webp, max 5 MB) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="mt-1.5 block w-full text-xs text-neutral-600 file:mr-3 file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-800 hover:file:bg-neutral-200 dark:text-neutral-300 dark:file:bg-neutral-800 dark:file:text-neutral-200 dark:hover:file:bg-neutral-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-xs bg-[#f9c83d] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-[#edbb2f] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </section>

        {/* Document List */}
        <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">

          <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Documents Shared With Me
              </h2>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                View or download files uploaded by your property owner.
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
                  <th className="px-6 py-4 font-medium">
                    Document Name
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Type
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Shared By
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Uploaded Date
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Actions
                  </th>
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
                    const id = document._id;
                    const isOpening = openingDocumentId === id;

                    return (
                      <tr
                        key={id}
                        className="border-t border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-[#1d1d1d]"
                      >
                        <td className="px-6 py-5 font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{document.documentName || "Untitled document"}</span>
                            <span
                              className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-medium ${
                                document.uploadedByModel === "Tenant"
                                  ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-400/10 dark:text-blue-400"
                                  : "border border-stone-200 bg-stone-100 text-stone-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              }`}
                            >
                              {document.uploadedByModel === "Tenant"
                                ? "Uploaded by you"
                                : "Shared by owner"}
                            </span>
                          </div>

                          {document.originalFileName && (
                            <div className="mt-1 text-xs font-normal text-neutral-400">
                              {document.originalFileName}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                          {getDocumentCategory(document)}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                          {document.uploadedByModel === "Tenant"
                            ? (document.uploadedBy?.fullName || "You")
                            : (document.uploadedBy?.role === "owner"
                                ? "Property Owner"
                                : document.uploadedBy?.username || "Property Owner")}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(document.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              disabled={!id || isOpening}
                              onClick={() =>
                                handleDocumentAction(document, "view")
                              }
                              className="text-sm font-medium text-neutral-800 underline underline-offset-4 hover:text-yellow-600 disabled:opacity-50 dark:text-yellow-300"
                            >
                              {isOpening ? "Opening..." : "View"}
                            </button>

                            <button
                              type="button"
                              disabled={!id || isOpening}
                              onClick={() =>
                                handleDocumentAction(document, "download")
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
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center sm:px-7"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xs bg-[#f7f5f0] text-2xl text-neutral-500 dark:bg-[#222222] dark:text-neutral-300">
                        ▤
                      </div>

                      <h3 className="mt-4 font-semibold">
                        {activeFilter === "All"
                          ? "No documents shared yet"
                          : `No ${activeFilter.toLowerCase()} documents found`}
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                        Documents uploaded by your property owner will appear here.
                        Contact your property owner if you are expecting a document.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>
        </section>

        {/* Information */}
        <section className="mt-6 rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
          <h3 className="font-semibold">
            About Your Documents
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Your property owner can upload rental agreements, ownership-related
            files, tax documents, and other tenancy documents for you.
            Once uploaded, you can view or download them here.
          </p>
        </section>

        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Documents
        </footer>
      </div>
    </div>
  );
};

export default TenantDocument;
