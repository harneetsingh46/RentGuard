import React, { useState } from "react";
import { Link } from "react-router-dom";

const TenantDocument = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  // Empty for now — we'll connect your backend later
  const documents = [];

  const filters = ["All", "Lease", "Receipts", "Other"];

  const filteredDocuments =
    activeFilter === "All"
      ? documents
      : documents.filter((document) => document.type === activeFilter);

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
              View and manage your rental documents in one place.
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

        {/* Summary Cards */}
        <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Total Documents */}
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

          {/* Lease Documents */}
          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Lease Documents
                </p>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {documents.filter((doc) => doc.type === "Lease").length}
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

          {/* Other Documents */}
          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-[#171717] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Other Documents
                </p>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  {documents.filter((doc) => doc.type !== "Lease").length}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-4xl bg-green-50 text-xl text-green-700 dark:bg-green-400/10 dark:text-green-400">
                ✓
              </div>
            </div>

            <p className="mt-7 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Receipts and other rental files
            </p>
          </div>
        </section>

        {/* Document List */}
        <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-7">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                All Documents
              </h2>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your rental agreements, receipts, and other files.
              </p>
            </div>

            {/* Filters */}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-[#faf9f6] dark:bg-[#1d1d1d]">
                <tr className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <th className="px-6 py-4 font-medium sm:px-7">
                    Document Name
                  </th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Uploaded Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="border-t border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-[#1d1d1d]"
                    >
                      <td className="px-6 py-5 font-medium sm:px-7">
                        {document.name}
                      </td>

                      <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                        {document.type}
                      </td>

                      <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                        {document.uploadedAt || "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-xs bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400">
                          {document.status || "Available"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {document.url ? (
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-neutral-800 underline underline-offset-4 hover:text-yellow-600 dark:text-yellow-300"
                          >
                            View file
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
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
                        No documents found
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                        Your rental documents will appear here once they are
                        available.
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
                  Keep copies of your rental agreement, receipts, and other
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

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Documents
        </footer>
      </div>
    </div>
  );
};

export default TenantDocument;