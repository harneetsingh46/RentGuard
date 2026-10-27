
import React, { useEffect, useMemo, useRef, useState } from 'react'
import apiClient from '../../ApiClient/interceptor.js'
import { useToast } from "../../common/ToastProvider"
import toast from "react-hot-toast";
import ConfirmModal from "../../common/ConfirmModal"
import { Pencil, LogOut, Search, Upload, X, FileText, FileImage, LoaderCircle } from "lucide-react"

const Tenant = () => {
  const { showToast } = useToast()
  const [tenantSearch, setTenantSearch] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const searchRef = useRef(null)
  const [confirmTenant, setConfirmTenant] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [tenants, setTenants] = useState([])
  const [history, setHistory] = useState([])
  const [activeSection, setActiveSection] = useState('active')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: '',
    address: '',
    aadhaarNumber: '',
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

          const [activeTenants, pastTenants] = await Promise.all([
            fetchList(`/property/${property._id}/tenants`),
            fetchList(`/property/${property._id}/tenants/history`),
          ])

          return { activeTenants, pastTenants }
        })
      )

      setTenants(results.flatMap((item) => item.activeTenants))
      setHistory(results.flatMap((item) => item.pastTenants))
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
      aadhaarNumber: tenant.aadhaarNumber || '',
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

    if (
      !editForm.fullName.trim() ||
      !editForm.address.trim() ||
      !/^\d{12}$/.test(editForm.aadhaarNumber)
    ) {
      setError('Enter the tenant name, address, and a valid 12-digit Aadhaar number.')
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
          aadhaarNumber: editForm.aadhaarNumber,
        }
      )

      setEditModalOpen(false)
      setSelectedTenant(null)
      setSuccess('Tenant updated successfully.')
      showToast('Tenant updated successfully.', 'success'); toast.success('Tenant updated successfully.');
      await getTenants()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update tenant.', 'error'); toast.error(err.response?.data?.message || 'Failed to update tenant.');
      setError(
        err.response?.data?.message || 'Failed to update tenant.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Open the custom move-out confirmation modal
  const handleMoveOut = (tenant) => setConfirmTenant(tenant)

  const confirmMoveOut = async () => {
    if (!confirmTenant) return
    const tenantToMove = confirmTenant
    try {
      setConfirmLoading(true)
      await apiClient.patch(
        `/property/${tenantToMove.property}/tenants/${tenantToMove._id}/move-out`
      )
      setConfirmTenant(null)
      showToast(`${tenantToMove.fullName} has been moved out successfully.`, "success"); toast.success(`${tenantToMove.fullName} has been moved out successfully.`);
      await getTenants()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to move out tenant.', 'error'); toast.error(err.response?.data?.message || 'Failed to move out tenant.');
    } finally {
      setConfirmLoading(false)
    }
  }

  const displayedTenants =
    activeSection === 'active' ? tenants : history

  const matchingTenants = useMemo(() => {
    const query = tenantSearch.trim().toLowerCase()
    if (!query) return []
    return displayedTenants.filter((tenant) => {
      const searchable = [
        tenant.fullName,
        tenant.user?.username,
        tenant.user?.email,
        tenant.email,
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
        tenant.user?.username,
        tenant.user?.email,
        tenant.email,
        tenant.propertyName,
        tenant.unit?.unitName,
        tenant.address,
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [displayedTenants, tenantSearch])

  const selectSearchTenant = (tenant) => {
    setTenantSearch(tenant.fullName || tenant.user?.username || '')
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
      toast.success('Document uploaded successfully.')
      closeUploadModalAfterSuccess()
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload the document.'
      setUploadError(message)
      showToast(message, 'error')
      toast.error(message)
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

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

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
            placeholder="Search tenant by name, email, property, or unit..."
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
                <span className="font-medium text-gray-900 dark:text-white">{tenant.fullName || tenant.user?.username || 'Unnamed tenant'}</span>
                <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {[tenant.propertyName, tenant.unit?.unitName, tenant.user?.email || tenant.email].filter(Boolean).join(' · ')}
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
      </div>

      {loading ? (
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
          {filteredTenants.map((tenant) => (
            <article
              key={tenant._id}
              className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-[#1b1b1b] sm:p-4"
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
                    onClick={() => openTenantDocuments(tenant)}
                    aria-label={`Upload document for ${tenant.fullName}`}
                    title="Upload document"
                    className="inline-flex min-h-10 items-center justify-center rounded-xs border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                  >
                    <Upload size={17} />
                    <span className="ml-2 text-sm">Upload Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOut(tenant)}
                    aria-label={`Move out ${tenant.fullName}`}
                    title="Move tenant out"
                    className="inline-flex min-h-10 items-center justify-center rounded-xs border border-red-200 p-2 text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut size={17} />
                    <span className="ml-2 text-sm">Move Out</span>
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
              {filteredTenants.map((tenant) => (
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
                          onClick={() => openTenantDocuments(tenant)}
                          aria-label={`Upload document for ${tenant.fullName}`}
                          title="Upload document"
                          className="mx-1 my-1 inline-flex items-center justify-center gap-2 rounded-xs border border-gray-300 px-3 py-2 text-gray-700 transition hover:bg-gray-100 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800"
                        >
                          <Upload size={16} />
                          <span>Upload Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOut(tenant)}
                          aria-label={`Move out ${tenant.fullName}`}
                          title="Move tenant out"
                          className="mx-1 my-1 inline-flex items-center justify-center rounded-xs border border-red-200 p-2 text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <LogOut size={17} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
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
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">For {uploadTenant.fullName || uploadTenant.user?.username || 'Selected tenant'}</p>
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

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aadhaar Number
                </label>
                <input
                  name="aadhaarNumber"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{12}"
                  maxLength={12}
                  value={editForm.aadhaarNumber}
                  onChange={handleEditChange}
                  required
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

      <ConfirmModal
        isOpen={Boolean(confirmTenant)}
        title="Move tenant out?"
        message={confirmTenant ? `Are you sure you want to move out ${confirmTenant.fullName}? This will move the tenant to history.` : ''}
        confirmText="Move Out"
        loading={confirmLoading}
        onCancel={() => { if (!confirmLoading) setConfirmTenant(null) }}
        onConfirm={confirmMoveOut}
      />
    </div>
  )
}

export default Tenant