import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../ApiClient/interceptor.js";
import {
  Eye,
  Download,
  Trash2,
  X,
  FileText,
  FileImage,
  Upload,
  LoaderCircle,
  File,
  RefreshCw,
} from "lucide-react";

const isValidMongoId = (value) =>
  typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDocumentFormat = (document) => {
  const format = (
    document?.fileFormat ||
    document?.originalFileName?.split(".").pop() ||
    ""
  ).toLowerCase();

  return format === "jpeg" ? "jpg" : format;
};

const isImageDocument = (document) =>
  ["jpg", "png", "webp"].includes(getDocumentFormat(document));

const isPdfDocument = (document) =>
  getDocumentFormat(document) === "pdf";

const Documents = () => {
  const { propertyId: routePropertyId } = useParams();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("agreement");
  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");

  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Delete confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] =
    useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const response = await apiClient.get("/property/");
      const propertyList = response.data?.data || [];

      setProperties(propertyList);

      setSelectedPropertyId((currentId) =>
        propertyList.some((property) => property._id === currentId)
          ? currentId
          : ""
      );
    } catch (err) {
      setProperties([]);
      setError(
        err.response?.data?.message || "Failed to load your properties."
      );
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (propertyId) => {
    if (!isValidMongoId(propertyId)) {
      setDocuments([]);
      return;
    }

    try {
      setLoadingDocuments(true);
      setError("");

      const response = await apiClient.get(`/document/${propertyId}`);
      setDocuments(response.data?.data || []);
    } catch (err) {
      setDocuments([]);
      setError(
        err.response?.data?.message || "Failed to load property documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    setDocuments([]);
    setSuccess("");

    if (isValidMongoId(selectedPropertyId)) {
      fetchDocuments(selectedPropertyId);
    } else {
      setLoadingDocuments(false);
    }
  }, [selectedPropertyId, fetchDocuments]);

  const closePreview = useCallback(() => {
    setPreviewDocument(null);
    setPreviewUrl("");
    setLoadingPreview(false);
  }, []);

  useEffect(() => {
    if (!previewDocument) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closePreview();
    };

    window.document.addEventListener("keydown", handleKeyDown);
    window.document.body.style.overflow = "hidden";

    return () => {
      window.document.removeEventListener("keydown", handleKeyDown);
      window.document.body.style.overflow = "";
    };
  }, [previewDocument, closePreview]);

  // Upload a property document
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!isValidMongoId(selectedPropertyId)) {
      setError("Please select a property first.");
      return;
    }

    if (!documentName.trim()) {
      setError("Please enter a document name.");
      return;
    }

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, PNG, and WebP files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The file must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("documentName", documentName.trim());
    formData.append("documentType", documentType);
    formData.append("document", file);

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await apiClient.post(`/document/${selectedPropertyId}`, formData);

      setDocumentName("");
      setDocumentType("agreement");
      setFile(null);

      const fileInput = window.document.getElementById(
        "property-document-file"
      );

      if (fileInput) fileInput.value = "";

      setSuccess("Document uploaded successfully."); toast.success("Document uploaded successfully.");

      await fetchDocuments(selectedPropertyId);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload the document."
      );
    } finally {
      setUploading(false);
    }
  };

  // Get a secure URL for viewing or downloading a document
  const getDocumentUrl = async (document, mode = "view") => {
    const response = await apiClient.get(
      `/document/${selectedPropertyId}/${document._id}/download`,
      {
        params: mode === "view" ? { mode: "view" } : undefined,
      }
    );

    const url = response.data?.data?.downloadUrl;

    if (!url) {
      throw new Error("The document URL was not returned by the server.");
    }

    return url;
  };

  // Open the document preview modal
  const handleView = async (document) => {
    setPreviewDocument(document);
    setPreviewUrl("");
    setLoadingPreview(true);
    setError("");

    try {
      const url = await getDocumentUrl(document, "view");
      setPreviewUrl(url);
    } catch (err) {
      setPreviewDocument(null);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to open the document preview."
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  // Download a document
  const handleDownload = async (document) => {
    try {
      setError("");

      const url = await getDocumentUrl(document, "download");

      const link = window.document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download =
        document.originalFileName || document.documentName;

      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to download the document."
      );
    }
  };

  // Open the confirmation modal instead of window.confirm()
  const handleDelete = (document) => {
    setDocumentToDelete(document);
    setShowConfirmationModal(true);
    setError("");
  };

  // Delete only after the user confirms
  const confirmDelete = async () => {
    if (!documentToDelete || deletingDocumentId) return;

    const document = documentToDelete;

    try {
      setDeletingDocumentId(document._id);
      setError("");
      setSuccess("");
      setShowConfirmationModal(false);

      await apiClient.delete(
        `/document/${selectedPropertyId}/${document._id}`
      );

      setDocuments((previous) =>
        previous.filter((item) => item._id !== document._id)
      );

      if (previewDocument?._id === document._id) {
        closePreview();
      }

      setSuccess("Document deleted successfully."); toast.success("Document deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete the document."
      );
    } finally {
      setDeletingDocumentId("");
      setDocumentToDelete(null);
    }
  };

  // Cancel document deletion
  const cancelDelete = () => {
    if (deletingDocumentId) return;

    setShowConfirmationModal(false);
    setDocumentToDelete(null);
  };

  const selectedProperty = properties.find(
    (property) => property._id === selectedPropertyId
  );

  const inputClass =
    "w-full min-w-0 rounded-xs border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-100 dark:placeholder:text-stone-500";

  const buttonClass =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-xs px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-400/40 disabled:cursor-not-allowed disabled:opacity-50";

  const renderActions = (document) => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handleView(document)}
        disabled={Boolean(deletingDocumentId)}
        className={`${buttonClass} border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-200 dark:hover:bg-neutral-800`}
        aria-label={`View ${document.documentName}`}
      >
        <Eye size={16} />
        View
      </button>

      <button
        type="button"
        onClick={() => handleDownload(document)}
        disabled={Boolean(deletingDocumentId)}
        className={`${buttonClass} border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-200 dark:hover:bg-neutral-800`}
        aria-label={`Download ${document.documentName}`}
      >
        <Download size={16} />
        Download
      </button>

      <button
        type="button"
        onClick={() => handleDelete(document)}
        disabled={Boolean(deletingDocumentId)}
        className={`${buttonClass} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900`}
        aria-label={`Delete ${document.documentName}`}
      >
        {deletingDocumentId === document._id ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
        {deletingDocumentId === document._id ? "Deleting" : "Delete"}
      </button>
    </div>
  );

  return (
    <div className="w-full min-w-0 p-4 text-stone-900 transition-colors duration-300 dark:text-stone-100 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        {/* Page heading */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Documents
            </h1>

            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              View, upload, download, and manage your property documents.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xs border border-stone-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <FileText size={20} className="text-yellow-500" />

            <div>
              <p className="text-lg font-semibold leading-5">
                {documents.length}
              </p>

              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Documents
              </p>
            </div>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between gap-3 rounded-xs border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="mb-4 flex items-start justify-between gap-3 rounded-xs border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          >
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Property selector */}
        <section className="mb-5 rounded-xs border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold">Select property</h2>

            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Choose the property whose documents you want to manage.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              id="documents-property-select"
              value={selectedPropertyId}
              onChange={(event) =>
                setSelectedPropertyId(event.target.value)
              }
              disabled={loadingProperties || properties.length === 0}
              className={`${inputClass} sm:max-w-xl`}
            >
              <option value="">
                {loadingProperties
                  ? "Loading properties..."
                  : properties.length === 0
                    ? "No properties available"
                    : "Select a property"}
              </option>

              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.propertyName || property.name || "Unnamed property"}
                  {property.address ? ` — ${property.address}` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => fetchDocuments(selectedPropertyId)}
              disabled={
                loadingDocuments || !isValidMongoId(selectedPropertyId)
              }
              className={`${buttonClass} border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-200 dark:hover:bg-neutral-800`}
            >
              <RefreshCw
                size={15}
                className={loadingDocuments ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {selectedProperty && (
            <p className="mt-3 break-words text-sm text-stone-500 dark:text-stone-400">
              Selected:{" "}
              <span className="font-medium text-stone-800 dark:text-stone-200">
                {selectedProperty.propertyName || selectedProperty.name}
              </span>

              {selectedProperty.address
                ? ` · ${selectedProperty.address}`
                : ""}
            </p>
          )}
        </section>

        {!loadingProperties && properties.length === 0 ? (
          <section className="rounded-xs border border-stone-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <FileText
              size={30}
              className="mx-auto mb-3 text-stone-400 dark:text-stone-500"
            />

            <h2 className="text-lg font-semibold">No properties yet</h2>

            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Add a property in Properties &amp; Units before uploading
              documents.
            </p>
          </section>
        ) : !isValidMongoId(selectedPropertyId) ? (
          <section className="rounded-xs border border-stone-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <FileText
              size={30}
              className="mx-auto mb-3 text-stone-400 dark:text-stone-500"
            />

            <h2 className="text-lg font-semibold">Select a property</h2>

            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Choose a property above to upload and manage its documents.
            </p>
          </section>
        ) : (
          <>
            {/* Upload form */}
            <section className="mb-6 rounded-xs border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xs bg-yellow-300 text-black">
                  <Upload size={19} />
                </div>

                <div>
                  <h2 className="font-semibold">Upload document</h2>

                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    PDF, JPG, PNG, or WebP. Maximum size: 5 MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="min-w-0">
                    <label
                      htmlFor="property-document-name"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Document name
                    </label>

                    <input
                      id="property-document-name"
                      type="text"
                      value={documentName}
                      onChange={(event) =>
                        setDocumentName(event.target.value)
                      }
                      placeholder="e.g. Rental Agreement"
                      maxLength={100}
                      className={inputClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="property-document-type"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Document type
                    </label>

                    <select
                      id="property-document-type"
                      value={documentType}
                      onChange={(event) =>
                        setDocumentType(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="agreement">Rental Agreement</option>
                      <option value="ownership">Ownership Document</option>
                      <option value="tax">Tax Document</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="property-document-file"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Select file
                    </label>

                    <input
                      id="property-document-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setFile(event.target.files?.[0] || null)
                      }
                      className={`${inputClass} file:mr-3 file:rounded-xs file:border-0 file:bg-yellow-300 file:px-2 file:py-1 file:font-medium file:text-black hover:file:bg-yellow-400`}
                    />
                  </div>
                </div>

                {file && (
                  <div className="flex min-w-0 items-center gap-3 rounded-xs border border-stone-200 bg-stone-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
                    {file.type === "application/pdf" ? (
                      <FileText
                        size={18}
                        className="shrink-0 text-red-500"
                      />
                    ) : (
                      <FileImage
                        size={18}
                        className="shrink-0 text-blue-500"
                      />
                    )}

                    <span className="min-w-0 flex-1 break-all text-sm">
                      {file.name}
                    </span>

                    <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);

                        const input = window.document.getElementById(
                          "property-document-file"
                        );

                        if (input) input.value = "";
                      }}
                      aria-label="Remove selected file"
                      className="shrink-0 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Supported formats: PDF, JPG, PNG, WebP
                  </p>

                  <button
                    type="submit"
                    disabled={uploading}
                    className={`${buttonClass} w-full bg-yellow-300 px-5 font-medium text-black hover:bg-yellow-400 sm:w-auto`}
                  >
                    {uploading ? (
                      <>
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Uploaded documents */}
            <section className="min-w-0 overflow-hidden rounded-xs border border-stone-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-2 border-b border-stone-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="font-semibold">Uploaded documents</h2>

                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {documents.length}{" "}
                    {documents.length === 1 ? "document" : "documents"}
                  </p>
                </div>

                {loadingDocuments && (
                  <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                    Loading...
                  </span>
                )}
              </div>

              {loadingDocuments && documents.length === 0 ? (
                <div className="p-10 text-center text-sm text-stone-500 dark:text-stone-400">
                  <LoaderCircle
                    size={25}
                    className="mx-auto mb-3 animate-spin"
                  />
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-10 text-center">
                  <File
                    size={28}
                    className="mx-auto mb-3 text-stone-400 dark:text-stone-500"
                  />

                  <h3 className="font-medium">No documents yet</h3>

                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Upload the first document for this property.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop and tablet table */}
                  <div className="hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-neutral-800 dark:text-stone-400">
                        <tr>
                          <th className="px-5 py-3 font-medium">
                            Document
                          </th>

                          <th className="px-4 py-3 font-medium">Type</th>

                          <th className="px-4 py-3 font-medium">
                            Uploaded by
                          </th>

                          <th className="px-4 py-3 font-medium">Date</th>

                          <th className="px-5 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                        {documents.map((document) => (
                          <tr
                            key={document._id}
                            className="transition hover:bg-stone-50 dark:hover:bg-neutral-800/60"
                          >
                            <td className="max-w-[280px] px-5 py-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-stone-300">
                                  {isPdfDocument(document) ? (
                                    <FileText size={19} />
                                  ) : (
                                    <FileImage size={19} />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="break-words font-medium">
                                    {document.documentName}
                                  </p>

                                  <p className="mt-1 break-all text-xs text-stone-500 dark:text-stone-400">
                                    {document.originalFileName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 capitalize text-stone-600 dark:text-stone-300">
                              {document.documentType || "other"}
                            </td>

                            <td className="px-4 py-4 text-stone-600 dark:text-stone-300">
                              {document.uploadedBy?.username ||
                                document.uploadedBy?.email ||
                                "Owner"}

                              {document.tenant?.fullName && (
                                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                  Tenant: {document.tenant.fullName}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-stone-600 dark:text-stone-300">
                              {formatDate(document.createdAt)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end">
                                {renderActions(document)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile document cards */}
                  <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
                    {documents.map((document) => (
                      <article
                        key={document._id}
                        className="min-w-0 rounded-xs border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs bg-stone-100 text-stone-600 dark:bg-neutral-800 dark:text-stone-300">
                            {isPdfDocument(document) ? (
                              <FileText size={20} />
                            ) : (
                              <FileImage size={20} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-sm font-medium">
                              {document.documentName}
                            </h3>

                            <p className="mt-1 break-all text-xs text-stone-500 dark:text-stone-400">
                              {document.originalFileName}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                              <span className="rounded-xs bg-stone-100 px-2 py-1 capitalize dark:bg-neutral-800">
                                {document.documentType || "other"}
                              </span>

                              <span>
                                {formatDate(document.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-stone-200 pt-3 dark:border-neutral-800">
                          <p className="mb-3 break-words text-xs text-stone-500 dark:text-stone-400">
                            Uploaded by:{" "}
                            {document.uploadedBy?.username ||
                              document.uploadedBy?.email ||
                              "Owner"}
                          </p>

                          {renderActions(document)}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>

      {/* Document preview modal */}
      {previewDocument && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xs border border-stone-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[92dvh]"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-neutral-800 sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs bg-stone-100 text-stone-700 dark:bg-neutral-800 dark:text-stone-200">
                  {isPdfDocument(previewDocument) ? (
                    <FileText size={19} />
                  ) : (
                    <FileImage size={19} />
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    id="document-preview-title"
                    className="break-words font-semibold"
                  >
                    {previewDocument.documentName}
                  </h2>

                  <p className="mt-1 break-all text-xs text-stone-500 dark:text-stone-400">
                    {previewDocument.originalFileName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePreview}
                aria-label="Close document preview"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-auto bg-stone-100 p-2 dark:bg-neutral-950 sm:min-h-[400px] sm:p-4">
              {loadingPreview ? (
                <div className="py-16 text-center">
                  <LoaderCircle
                    size={30}
                    className="mx-auto animate-spin text-yellow-500"
                  />

                  <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                    Preparing document preview...
                  </p>
                </div>
              ) : previewUrl && isImageDocument(previewDocument) ? (
                <img
                  src={previewUrl}
                  alt={previewDocument.documentName}
                  className="block max-h-[65dvh] max-w-full rounded-xs object-contain sm:max-h-[68dvh]"
                />
              ) : previewUrl && isPdfDocument(previewDocument) ? (
                <iframe
                  src={previewUrl}
                  title={`Preview: ${previewDocument.documentName}`}
                  className="h-[65dvh] min-h-[350px] w-full border-0 bg-white sm:h-[68dvh]"
                />
              ) : (
                <div className="px-5 py-12 text-center">
                  <File
                    size={30}
                    className="mx-auto text-stone-400 dark:text-stone-500"
                  />

                  <p className="mt-3 font-medium">
                    Preview is not available for this file type.
                  </p>

                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Download the file to open it.
                  </p>
                </div>
              )}
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-stone-200 px-4 py-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs capitalize text-stone-500 dark:text-stone-400">
                {previewDocument.documentType || "other"} ·{" "}
                {formatDate(previewDocument.createdAt)}
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closePreview}
                  className={`${buttonClass} border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-200 dark:hover:bg-neutral-800`}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(previewDocument)}
                  className={`${buttonClass} bg-yellow-300 text-black hover:bg-yellow-400`}
                >
                  <Download size={16} />
                  Download document
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showConfirmationModal && documentToDelete && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelDelete();
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            aria-describedby="delete-document-description"
            className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-document-title"
              className="text-lg font-semibold text-stone-900 dark:text-stone-100"
            >
              Delete document?
            </h2>

            <p
              id="delete-document-description"
              className="mt-2 break-words text-sm leading-6 text-stone-600 dark:text-stone-400"
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                "{documentToDelete.documentName}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={Boolean(deletingDocumentId)}
                className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-stone-200 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingDocumentId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingDocumentId === documentToDelete._id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete document
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Documents;