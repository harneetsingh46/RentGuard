import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Pagination = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)

    for (let page = start; page <= end; page++) {
      pages.push(page)
    }

    return pages
  }

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {startItem}–{endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {totalItems}
        </span>{" "}
        records
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center gap-1 rounded-xs border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {getPages().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-xs border px-3 text-sm font-medium ${
              currentPage === page
                ? "border-yellow-400 bg-yellow-300 text-black"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xs border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Pagination