import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../ApiClient/interceptor";

const isValidMongoId = (value) =>
  typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const Documents = () => {
  const { propertyId: routePropertyId } = useParams();

  // Never treat the route placeholder (":propertyId") as a real ID.
  const validRoutePropertyId = isValidMongoId(routePropertyId)
    ? routePropertyId
    : "";

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    validRoutePropertyId
  );
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("agreement");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchProperties = async () => {
      try {
        setLoadingProperties(true);
        setError("");

        const response = await apiClient.get("/property/");
        const propertyList = response.data?.data || [];

        if (!active) return;

        setProperties(propertyList);

        if (
          validRoutePropertyId &&
          propertyList.some((property) => property._id === validRoutePropertyId)
        ) {
          setSelectedPropertyId(validRoutePropertyId);
        } else if (
          selectedPropertyId &&
          propertyList.some((property) => property._id === selectedPropertyId)
        ) {
          // Keep the current selection if it still exists.
        } else {
          setSelectedPropertyId("");
        }
      } catch (err) {
        if (active) {
          setProperties([]);
          setSelectedPropertyId("");
          setError(
            err.response?.data?.message || "Failed to load your properties."
          );
        }
      } finally {
        if (active) setLoadingProperties(false);
      }
    };

    fetchProperties();

    return () => {
      active = false;
    };
    // selectedPropertyId is intentionally not a dependency: fetching properties
    // should happen when the route property changes, not after every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRoutePropertyId]);

  const fetchDocuments = async (propertyId = selectedPropertyId) => {
    if (!isValidMongoId(propertyId)) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get(`/document/${propertyId}`);
      setDocuments(response.data?.data || []);
    } catch (err) {
      setDocuments([]);
      setError(
        err.response?.data?.message || "Failed to load property documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDocuments([]);
    setFile(null);
    setDocumentName("");
    setError("");

    if (isValidMongoId(selectedPropertyId)) {
      fetchDocuments(selectedPropertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropertyId]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!isValidMongoId(selectedPropertyId)) {
      setError("Please select a valid property first.");
      return;
    }

    if (!documentName.trim()) {
      setError("Please enter a document name.");
      return;
    }

    if (!file) {
      setError("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("documentName", documentName.trim());
    formData.append("documentType", documentType);
    formData.append("document", file);

    try {
      setUploading(true);
      setError("");

      await apiClient.post(`/document/${selectedPropertyId}`, formData);

      setDocumentName("");
      setDocumentType("agreement");
      setFile(null);

      const fileInput = document.getElementById("property-document-file");
      if (fileInput) fileInput.value = "";

      await fetchDocuments(selectedPropertyId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId) => {
    if (!isValidMongoId(selectedPropertyId)) {
      setError("Please select a valid property first.");
      return;
    }

    try {
      setError("");

      const response = await apiClient.get(
        `/document/${selectedPropertyId}/${documentId}/download`
      );

      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) {
        throw new Error("Download link is unavailable.");
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to download document."
      );
    }
  };

  const handleDelete = async (documentId) => {
    if (!isValidMongoId(selectedPropertyId)) {
      setError("Please select a valid property first.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setError("");
      await apiClient.delete(`/document/${selectedPropertyId}/${documentId}`);
      setDocuments((previous) =>
        previous.filter((document) => document._id !== documentId)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    }
  };

  const inputClass =
    "w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-yellow-400 dark:border-gray-600 dark:bg-[#111111] dark:text-white";

  return (
    <main className="min-h-[calc(100vh-90px)] w-full bg-white p-6 text-gray-900 dark:bg-[#111111] dark:text-white md:p-6">
      <div className="w-full">
        <header className="mb-5">
          <h1 className="text-xl font-semibold">Property Documents</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload and manage agreements, ownership records, tax documents, and
            other property files.
          </p>
        </header>

        <div className="mb-5 max-w-xl">
          <label
            htmlFor="documents-property-select"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Select Property
          </label>
          <select
            id="documents-property-select"
            value={selectedPropertyId}
            onChange={(event) => setSelectedPropertyId(event.target.value)}
            disabled={loadingProperties || properties.length === 0}
            className={inputClass}
          >
            <option value="">
              {loadingProperties
                ? "Loading properties..."
                : properties.length === 0
                  ? "No properties available"
                  : "No property selected"}
            </option>
            {properties.map((property) => (
              <option key={property._id} value={property._id}>
                {property.propertyName || property.name || "Unnamed property"}
                {property.address ? ` — ${property.address}` : ""}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 w-full rounded-xs border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!loadingProperties && properties.length === 0 ? (
          <div className="rounded-xs border border-gray-200 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            You haven’t added any properties yet. Add a property in{" "}
            <strong>Properties &amp; Units</strong> before uploading documents.
          </div>
        ) : !isValidMongoId(selectedPropertyId) ? (
          <div className="rounded-xs border border-gray-200 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            No property selected. Choose a property above to view, upload, and
            manage its documents.
          </div>
        ) : (
          <>
            <form onSubmit={handleUpload} className="mb-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="property-document-name"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Document Name
                  </label>
                  <input
                    id="property-document-name"
                    type="text"
                    value={documentName}
                    onChange={(event) => setDocumentName(event.target.value)}
                    placeholder="e.g. Rental Agreement"
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="property-document-type"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Document Type
                  </label>
                  <select
                    id="property-document-type"
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className={inputClass}
                  >
                    <option value="agreement">Rental Agreement</option>
                    <option value="ownership">Ownership Document</option>
                    <option value="tax">Tax Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="property-document-file"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Choose File
                  </label>
                  <input
                    id="property-document-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] || null)
                    }
                    className={`${inputClass} file:mr-3 file:rounded-xs file:border-0 file:bg-yellow-300 file:px-3 file:py-1.5 file:font-medium hover:file:bg-yellow-400`}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PDF, JPG, PNG, or WebP. Maximum size: 5 MB.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !isValidMongoId(selectedPropertyId)}
                className="rounded-xs bg-yellow-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </form>

            <section className="w-full border-t border-gray-200 pt-4 dark:border-gray-700">
              <h2 className="mb-3 text-base font-semibold">
                Uploaded Documents
              </h2>

              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading documents...
                </p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No documents uploaded for this property yet.
                </p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        <th className="px-3 py-3 font-medium">Document</th>
                        <th className="px-3 py-3 font-medium">Type</th>
                        <th className="px-3 py-3 font-medium">Uploaded</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr
                          key={document._id}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          <td className="px-3 py-3 font-medium">
                            {document.documentName}
                            <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                              {document.originalFileName}
                            </p>
                          </td>
                          <td className="px-3 py-3 capitalize text-gray-600 dark:text-gray-300">
                            {document.documentType}
                          </td>
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                            {document.createdAt
                              ? new Date(
                                  document.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleDownload(document._id)}
                                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(document._id)}
                                className="font-medium text-red-600 hover:underline dark:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Documents;
