
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../ApiClient/interceptor.js'
import { useToast } from "../../common/ToastProvider"
import Pagination from "../../common/Pagination"
import { Pencil, Search, Upload, X, FileText, FileImage, LoaderCircle, ReceiptText, Clock3, CheckCircle2 } from "lucide-react"

const Tenant = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [tenantSearch, setTenantSearch] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const searchRef = useRef(null)
  const [tenants, setTenants] = useState([])
  const [history, setHistory] = useState([])
  const [moveOutRequests, setMoveOutRequests] = useState([])
  const [approvingRequestId, setApprovingRequestId] = useState(null)
  const [approvalRequest, setApprovalRequest] = useState(null)
  const [activeSection, setActiveSection] = useState('active')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)

  // Upload-document modal state
  const [uploadTenant, setUploadTenant] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('agreement')
  const [documentFile, setDocumentFile] = useState(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Fetch tenants for all properties owned by the logged-in owner
  const getTenants = async () => {
    try {
      setLoading(true)
      setError('')

      const propertyResponse = await apiClient.get('/property/')
      const properties = propertyResponse.data.data || []

      const results = await Promise.all(
        properties.map(async (property) => {
          const fetchList = async (url) => {
            try {
              const response = await apiClient.get(url)

              return (response.data.data || []).map((tenant) => ({
                ...tenant,
                propertyName: property.propertyName,
              }))
            } catch (err) {
              if (err.response?.status === 404) {
                return []
              }

              throw err
            }
          }

          const [activeTenants, pastTenants, requestsResponse] = await Promise.all([
            fetchList(`/property/${property._id}/tenants`),
            fetchList(`/property/${property._id}/tenants/history`),
            apiClient.get(`/property/${property._id}/move-out-requests`).catch((err) => {
              if (err.response?.status === 404) return { data: { data: [] } }
              throw err
            }),
          ])

          const requests = (requestsResponse.data.data || []).map((tenant) => ({
            ...tenant,
            // The backend returns Tenant documents, not a nested `tenant` object.
            // Normalize the response to the shape used by this page.
            tenant,
            status: tenant.moveOutRequest?.status || "pending",
            requestedAt: tenant.moveOutRequest?.requestedAt || null,
            expiresAt: tenant.moveOutRequest?.expiresAt || null,
            property: property._id,
            propertyName: property.propertyName,
          }))

          return { activeTenants, pastTenants, requests }
        })
      )

      setTenants(results.flatMap((item) => item.activeTenants))
      setHistory(results.flatMap((item) => item.pastTenants))
      setMoveOutRequests(results.flatMap((item) => item.requests))
    } catch (err) {
      console.error('Error fetching tenants:', err)
      setError(
        err.response?.data?.message || 'Failed to fetch tenants.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTenants()
  }, [])

  // Open the edit modal
  const openEditModal = (tenant) => {
    setSelectedTenant(tenant)
    setEditForm({
      fullName: tenant.fullName || '',
      address: tenant.address || '',
    })
    setError('')
    setSuccess('')
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (saving) return

    setEditModalOpen(false)
    setSelectedTenant(null)
  }

  const handleEditChange = (e) => {
    setEditForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }))
  }

  // Save tenant changes
  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!selectedTenant) return

    if (!editForm.fullName.trim() || !editForm.address.trim()) {
      setError('Enter the tenant name and address.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await apiClient.put(
        `/property/${selectedTenant.property}/tenants/${selectedTenant._id}`,
        {
          fullName: editForm.fullName.trim(),
          address: editForm.address.trim(),
        }
      )

      setEditModalOpen(false)
      setSelectedTenant(null)
      setSuccess('Tenant updated successfully.')
      showToast('Tenant updated successfully.', 'success')
      await getTenants()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update tenant.', 'error')
      setError(
        err.response?.data?.message || 'Failed to update tenant.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Open the in-app confirmation modal before approving a move-out request.
  const approveMoveOutRequest = async () => {
    if (!approvalRequest) return

    const request = approvalRequest
    const tenantName = request.tenant?.fullName || "this tenant"

    try {
      setApprovingRequestId(request._id)

      await apiClient.patch(
        `/property/${request.property}/move-out-requests/${request._id}/approve`
      )

      setApprovalRequest(null)

      showToast(
        `${tenantName}'s move-out request was approved.`,
        "success"
      )

      await getTenants()
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to approve the move-out request."

      // Backend rejected the request because bills are unpaid or pending.
      if (err.response?.data?.code === "MOVE_OUT_UNPAID_BILLS") {
        setApprovalRequest(null)

        showToast(message, "error")

        // Refresh so the rejected request disappears from pending requests.
        await getTenants()
      } else {
        showToast(message, "error")
      }
    } finally {
      setApprovingRequestId(null)
    }
  }

  const displayedTenants = activeSection === 'history' ? history : tenants

  const matchingTenants = useMemo(() => {
    const query = tenantSearch.trim().toLowerCase()
    if (!query) return []
    return displayedTenants.filter((tenant) => {
      const searchable = [
        tenant.fullName,
        tenant.email,
        tenant.phone,
        tenant.propertyName,
        tenant.unit?.unitName,
        tenant.address,
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    }).slice(0, 8)
  }, [displayedTenants, tenantSearch])

  const filteredTenants = useMemo(() => {
    const query = tenantSearch.trim().toLowerCase()
    if (!query) return displayedTenants
    return displayedTenants.filter((tenant) => {
      const searchable = [
        tenant.fullName,
        tenant.email,
        tenant.phone,
        tenant.propertyName,
        tenant.unit?.unitName,
        tenant.address,
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [displayedTenants, tenantSearch])

  // Keep pagination within the available pages.
  const tenantTotalPages = Math.ceil(filteredTenants.length / PAGE_SIZE)
  const safeTenantPage = Math.min(
    currentPage,
    Math.max(tenantTotalPages, 1)
  )

  const paginatedTenants = useMemo(() => {
    const startIndex = (safeTenantPage - 1) * PAGE_SIZE

    return filteredTenants.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredTenants, safeTenantPage])

  // Move-out request pagination
  const requestTotalPages = Math.ceil(moveOutRequests.length / PAGE_SIZE)
  const safeRequestPage = Math.min(
    currentPage,
    Math.max(requestTotalPages, 1)
  )

  const paginatedMoveOutRequests = useMemo(() => {
    const startIndex = (safeRequestPage - 1) * PAGE_SIZE

    return moveOutRequests.slice(startIndex, startIndex + PAGE_SIZE)
  }, [moveOutRequests, safeRequestPage])

  useEffect(() => {
    const totalPages =
      activeSection === 'requests'
        ? Math.ceil(moveOutRequests.length / PAGE_SIZE)
        : Math.ceil(filteredTenants.length / PAGE_SIZE)

    const maxPage = Math.max(totalPages, 1)

    if (currentPage > maxPage) {
      setCurrentPage(maxPage)
    }
  }, [activeSection, currentPage, filteredTenants.length, moveOutRequests.length])

  const selectSearchTenant = (tenant) => {
    setTenantSearch(tenant.fullName || "")
    setCurrentPage(1)
    setSearchDropdownOpen(false)
  }

  const openTenantDocuments = (tenant) => {
    setUploadTenant(tenant)
    setDocumentName('')
    setDocumentType('agreement')
    setDocumentFile(null)
    setUploadError('')
  }

  const closeUploadModal = () => {
    if (uploadingDocument) return
    setUploadTenant(null)
    setDocumentName('')
    setDocumentType('agreement')
    setDocumentFile(null)
    setUploadError('')
  }

  const handleDocumentUpload = async (event) => {
    event.preventDefault()
    if (!uploadTenant) return

    if (!documentName.trim()) {
      setUploadError('Please enter a document name.')
      return
    }
    if (documentName.trim().length > 100) {
      setUploadError('Document name cannot exceed 100 characters.')
      return
    }
    if (!documentFile) {
      setUploadError('Please choose a file to upload.')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(documentFile.type)) {
      setUploadError('Only PDF, JPG, PNG, and WebP files are supported.')
      return
    }
    if (documentFile.size > 5 * 1024 * 1024) {
      setUploadError('The file must be 5 MB or smaller.')
      return
    }

    const formData = new FormData()
    formData.append('documentName', documentName.trim())
    formData.append('documentType', documentType)
    formData.append('document', documentFile)

    try {
      setUploadingDocument(true)
      setUploadError('')
      await apiClient.post(`/document/tenants/${uploadTenant._id}`, formData)
      showToast('Document uploaded successfully.', 'success')
      closeUploadModalAfterSuccess()
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload the document.'
      setUploadError(message)
      showToast(message, 'error')
    } finally {
      setUploadingDocument(false)
    }
  }

  const closeUploadModalAfterSuccess = () => {
    setUploadTenant(null)
    setDocumentName('')
    setDocumentType('agreement')
    setDocumentFile(null)
    setUploadError('')
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="mx-auto w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-4 break-words text-xl font-semibold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl">
        Tenant Management
      </h1>

      {/* {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )} */}

      {success && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          {success}
        </p>
      )}

      {/* Search tenants with autocomplete */}
      <div className="relative mb-4 max-w-xl" ref={searchRef}>
        <label htmlFor="tenant-management-search" className="sr-only">Search tenants</label>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="tenant-management-search"
            type="search"
            value={tenantSearch}
            onChange={(event) => {
              setTenantSearch(event.target.value)
              setCurrentPage(1)
              setSearchDropdownOpen(true)
            }}
            onFocus={() => setSearchDropdownOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchDropdownOpen(false)
              if (event.key === 'Enter' && matchingTenants.length > 0) {
                event.preventDefault()
                selectSearchTenant(matchingTenants[0])
              }
            }}
            placeholder="Search tenant by name, email, phone, property, or unit..."
            className="w-full rounded-xs border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:border-stone-700 dark:bg-[#1b1b1b] dark:text-white"
            autoComplete="off"
          />
        </div>
        {searchDropdownOpen && tenantSearch.trim() && (
          <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xs border border-gray-200 bg-white py-1 shadow-xl dark:border-stone-700 dark:bg-neutral-900">
            {matchingTenants.length ? matchingTenants.map((tenant) => (
              <button
                key={`${tenant._id}-${tenant.property}`}
                type="button"
                onClick={() => selectSearchTenant(tenant)}
                className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-yellow-50 focus:bg-yellow-50 focus:outline-none dark:hover:bg-stone-800 dark:focus:bg-stone-800"
              >
                <span className="font-medium text-gray-900 dark:text-white">{tenant.fullName || 'Unnamed tenant'}</span>
                <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {[tenant.propertyName, tenant.unit?.unitName, tenant.email || tenant.phone].filter(Boolean).join(' · ')}
                </span>
              </button>
            )) : (
              <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No matching tenants found.</p>
            )}
          </div>
        )}
        {tenantSearch.trim() && !searchDropdownOpen && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{filteredTenants.length} matching tenant{filteredTenants.length === 1 ? '' : 's'}</p>
        )}
      </div>

      {/* Active tenants and history sections */}
      <div className="mb-4 flex flex-wrap gap-x-2 gap-y-1 border-b border-gray-200 dark:border-stone-800 sm:mb-5 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setCurrentPage(1)
            setActiveSection('active')
            setError('')
            setSuccess('')
          }}
          className={`border-b-2 px-2 py-3 text-sm font-medium sm:px-4 sm:text-base ${activeSection === 'active'
            ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
          Active Tenants ({tenants.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentPage(1)
            setActiveSection('history')
            setError('')
            setSuccess('')
          }}
          className={`border-b-2 px-2 py-3 text-sm font-medium sm:px-4 sm:text-base ${activeSection === 'history'
            ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
          Tenant History ({history.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentPage(1)
            setActiveSection('requests')
            setError('')
            setSuccess('')
          }}
          className={`border-b-2 px-2 py-3 text-sm font-medium sm:px-4 sm:text-base ${activeSection === 'requests'
            ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
          Move-out Requests ({moveOutRequests.filter((request) => request.status === 'pending').length})
        </button>
      </div>

      {activeSection === 'requests' ? (
        loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading move-out requests...</p>
        ) : moveOutRequests.length === 0 ? (
          <div className="rounded-xs border border-gray-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-[#1b1b1b]">
            <Clock3 className="mx-auto text-gray-400" size={28} />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">There are no move-out requests across your properties.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {paginatedMoveOutRequests.map((request) => (
              <article key={request._id} className="rounded-xs border border-gray-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-[#1b1b1b] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.tenant?.fullName || "Tenant"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {request.propertyName} · {request.unit?.unitName || "Unit"}
                    </p>
                  </div>
                  <span className={`rounded-xs px-2.5 py-1 text-xs font-medium capitalize ${request.status === "pending"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                    : request.status === "approved"
                      ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                      : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    }`}>
                    {request.status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm dark:border-stone-800 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="mt-1 break-all text-gray-800 dark:text-gray-200">{request.tenant?.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd className="mt-1 text-gray-800 dark:text-gray-200">{request.tenant?.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Requested</dt>
                    <dd className="mt-1 text-gray-800 dark:text-gray-200">{request.requestedAt ? new Date(request.requestedAt).toLocaleString("en-IN") : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Valid until</dt>
                    <dd className="mt-1 text-gray-800 dark:text-gray-200">{request.expiresAt ? new Date(request.expiresAt).toLocaleString("en-IN") : "—"}</dd>
                  </div>
                </dl>
                {request.status === "pending" && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Approval is allowed only when every bill for this tenancy is fully paid.
                    </p>
                    <button
                      type="button"
                      onClick={() => setApprovalRequest(request)}
                      disabled={approvingRequestId === request._id}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xs bg-yellow-300 px-4 py-2.5 text-sm font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      {approvingRequestId === request._id ? "Approving..." : "Approve move-out"}
                    </button>
                  </div>
                )}
              </article>
              ))}
            </div>
            <Pagination
              currentPage={safeRequestPage}
            totalItems={moveOutRequests.length}
            pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )
      ) : loading ? (
        <p className="text-gray-600 dark:text-gray-300">
          Loading tenants...
        </p>
      ) : filteredTenants.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          {activeSection === 'active'
            ? 'No active tenants found across your properties.'
            : 'No previous tenants found across your properties.'}
        </p>
      ) : (
        <>
          {/* Mobile tenant cards */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:hidden">
            {paginatedTenants.map((tenant) => (
              <article
                key={tenant._id}
                className="min-w-0 rounded-sm border border-gray-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-[#1b1b1b] sm:p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                      {tenant.fullName}
                    </h2>
                    <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-400">
                      {tenant.propertyName || 'Property unavailable'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-xs px-2 py-1 text-xs font-medium ${tenant.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-200 text-gray-700 dark:bg-stone-700 dark:text-gray-300'
                      }`}
                  >
                    {tenant.isActive ? 'Active' : 'Moved Out'}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 border-t border-gray-100 pt-3 text-sm dark:border-stone-800 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Unit</dt>
                    <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">{tenant.unit?.unitName || 'Unit unavailable'}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly Rent</dt>
                    <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">
                      {tenant.unit?.rent != null ? `₹${tenant.unit.rent}` : 'N/A'}
                    </dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Address</dt>
                    <dd className="mt-1 break-words text-gray-800 dark:text-gray-200">{tenant.address || 'N/A'}</dd>
                  </div>
                  {activeSection === 'history' && (
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Move-out Date</dt>
                      <dd className="mt-1 text-gray-800 dark:text-gray-200">
                        {tenant.moveOutDate ? new Date(tenant.moveOutDate).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  )}
                </dl>

                {activeSection === 'active' && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => openEditModal(tenant)}
                      aria-label={`Edit ${tenant.fullName}`}
                      title="Edit tenant"
                      className="inline-flex min-h-10 items-center justify-center rounded-xs border border-black bg-yellow-300 p-2 text-gray-900 transition hover:bg-yellow-400 dark:text-gray-900"
                    >
                      <Pencil size={17} />
                      <span className="ml-2 text-sm">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/bill?propertyId=${tenant.property}&tenantId=${tenant._id}`)}
                      aria-label={`View bills for ${tenant.fullName}`}
                      title="View bills"
                      className="inline-flex min-h-10 items-center justify-center rounded-xs border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                    >
                      <ReceiptText size={17} />
                      <span className="ml-2 text-sm">Bills</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openTenantDocuments(tenant)}
                      aria-label={`Upload document for ${tenant.fullName}`}
                      title="Upload document"
                      className="inline-flex min-h-10 items-center justify-center rounded-xs border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                    >
                      <Upload size={17} />
                      <span className="ml-2 text-sm">Upload Document</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Full table for larger screens */}
          <div className="hidden overflow-x-auto rounded-xs border border-gray-200 dark:border-stone-800 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700 dark:bg-stone-900 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tenant Name</th>
                  <th className="px-4 py-3 font-semibold">Property</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Monthly Rent</th>
                  {activeSection === 'history' && (
                    <th className="px-4 py-3 font-semibold">Move-out Date</th>
                  )}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {activeSection === 'active' && (
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white dark:divide-stone-800 dark:bg-[#1b1b1b]">
                {paginatedTenants.map((tenant) => (
                  <tr
                    key={tenant._id}
                    className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-stone-900"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {tenant.fullName}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {tenant.propertyName}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {tenant.unit?.unitName || 'Unit unavailable'}
                    </td>

                    <td className="px-4 py-3">{tenant.address}</td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {tenant.unit?.rent != null
                        ? `₹${tenant.unit.rent}`
                        : 'N/A'}
                    </td>

                    {activeSection === 'history' && (
                      <td className="whitespace-nowrap px-4 py-3">
                        {tenant.moveOutDate
                          ? new Date(tenant.moveOutDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    )}

                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-xs px-2 py-1 text-xs font-medium ${tenant.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-200 text-gray-700 dark:bg-stone-700 dark:text-gray-300'
                          }`}
                      >
                        {tenant.isActive ? 'Active' : 'Moved Out'}
                      </span>
                    </td>

                    {activeSection === 'active' && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(tenant)}
                            aria-label={`Edit ${tenant.fullName}`}
                            title="Edit tenant"
                            className="mx-0 my-1 inline-flex m-1 items-center justify-center rounded-xs border border-black bg-yellow-300 p-2 text-gray-900 transition hover:bg-yellow-300 hover:text-black dark:text-gray-900 dark:hover:bg-yellow-400"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/owner/bill?propertyId=${tenant.property}&tenantId=${tenant._id}`)}
                            aria-label={`View bills for ${tenant.fullName}`}
                            title="View bills"
                            className="mx-0 my-1 inline-flex m-1 items-center justify-center rounded-xs border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                          >
                            <ReceiptText size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openTenantDocuments(tenant)}
                            aria-label={`Upload document for ${tenant.fullName}`}
                            title="Upload document"
                            className="mx-1 my-1 inline-flex items-center justify-center gap-2 rounded-xs border border-gray-300 px-3 py-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                          >
                            <Upload size={16} />
                            <span>Upload Document</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={safeTenantPage}
            totalItems={filteredTenants.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Move-out approval confirmation modal */}
      {approvalRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !approvingRequestId) {
              setApprovalRequest(null)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-moveout-title"
            aria-describedby="approve-moveout-description"
            className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-stone-700 dark:bg-[#1b1b1b] dark:text-white"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-300/10 text-yellow-300">
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <h2 id="approve-moveout-title" className="text-lg font-semibold">
                    Approve move-out request?
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
                    Please review before continuing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalRequest(null)}
                disabled={Boolean(approvingRequestId)}
                aria-label="Close confirmation modal"
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 dark:border-stone-700 dark:bg-[#111111]">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-stone-400">
                  Tenant
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {approvalRequest.tenant?.fullName || "Tenant"}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
                  {approvalRequest.propertyName || "Property"} · {approvalRequest.unit?.unitName || "Unit"}
                </p>
              </div>

              <div
                id="approve-moveout-description"
                className="rounded-sm border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-100"
              >
                Approving this request will immediately end the tenant's active
                tenancy and make the unit available, provided all bills are fully paid.
                The tenant's current session will also be invalidated.
              </div>

              <p className="text-xs leading-5 text-gray-500 dark:text-stone-400">
                If any bill is unpaid or reserved in checkout, the backend will
                reject the approval and the tenancy will remain active.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-5 sm:flex-row sm:justify-end dark:border-stone-800">
              <button
                type="button"
                onClick={() => setApprovalRequest(null)}
                disabled={Boolean(approvingRequestId)}
                className="rounded-sm border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={approveMoveOutRequest}
                disabled={Boolean(approvingRequestId)}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-yellow-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvingRequestId ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Approve move-out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload document modal */}
      {uploadTenant && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeUploadModal() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-tenant-document-title"
            className="my-auto w-full max-w-xl rounded-xs border border-gray-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b]"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-stone-800 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-yellow-300 text-black"><Upload size={19} /></span>
                <div className="min-w-0">
                  <h2 id="upload-tenant-document-title" className="text-lg font-semibold text-gray-900 dark:text-white">Upload Document</h2>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">For {uploadTenant.fullName || 'Selected tenant'}</p>
                </div>
              </div>
              <button type="button" onClick={closeUploadModal} disabled={uploadingDocument} aria-label="Close upload modal" className="rounded-xs p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-stone-800"><X size={19} /></button>
            </div>

            <form onSubmit={handleDocumentUpload} className="space-y-4 p-4 sm:p-5">
              {uploadError && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{uploadError}</p>}
              <div className="rounded-xs border border-gray-200 bg-gray-50 p-3 text-sm dark:border-stone-800 dark:bg-neutral-900">
                <p className="font-medium text-gray-900 dark:text-white">{uploadTenant.propertyName || 'Property'}</p>
                <p className="mt-1 text-gray-500 dark:text-gray-400">{uploadTenant.unit?.unitName || 'Unit unavailable'}</p>
              </div>
              <div>
                <label htmlFor="tenant-modal-document-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Document name</label>
                <input id="tenant-modal-document-name" type="text" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="e.g. Rental Agreement" maxLength={100} required className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-neutral-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="tenant-modal-document-type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Document type</label>
                <select id="tenant-modal-document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-neutral-900 dark:text-white">
                  <option value="agreement">Rental Agreement</option>
                  <option value="ownership">Ownership Document</option>
                  <option value="tax">Tax Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="tenant-modal-document-file" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Select file</label>
                <input id="tenant-modal-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} required className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded file:border-0 file:bg-yellow-300 file:px-3 file:py-1.5 file:font-medium file:text-black dark:border-stone-700 dark:bg-neutral-900 dark:text-white" />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, or WebP · Maximum size: 5 MB</p>
              </div>
              {documentFile && (
                <div className="flex min-w-0 items-center gap-3 rounded border border-gray-200 p-3 dark:border-stone-800">
                  {documentFile.type === 'application/pdf' ? <FileText size={18} className="shrink-0 text-red-500" /> : <FileImage size={18} className="shrink-0 text-blue-500" />}
                  <span className="min-w-0 flex-1 break-all text-sm text-gray-700 dark:text-gray-200">{documentFile.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">{(documentFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <button type="button" aria-label="Remove selected file" onClick={() => { setDocumentFile(null); const input = window.document.getElementById('tenant-modal-document-file'); if (input) input.value = '' }} className="text-gray-500 hover:text-red-500"><X size={17} /></button>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 dark:border-stone-800 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeUploadModal} disabled={uploadingDocument} className="rounded-xs border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800">Cancel</button>
                <button type="submit" disabled={uploadingDocument} className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-4 py-2 font-medium text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {uploadingDocument ? <><LoaderCircle size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload Document</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit tenant modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4"
          onClick={closeEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-tenant-title"
            className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1b1b1b] sm:max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-stone-800 sm:p-6">
              <h2
                id="edit-tenant-title"
                className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl"
              >
                Edit Tenant
              </h2>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close edit tenant modal"
                className="rounded-xs px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6"
            >
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  required
                  rows={3}
                  className="w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-yellow-400 dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 dark:border-stone-800 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="w-full rounded-xs border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xs bg-yellow-400 px-4 py-2 font-medium text-black hover:bg-yellow-500 disabled:opacity-50 sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Tenant