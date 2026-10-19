
import React, { useEffect, useState } from 'react'
import apiClient from '../ApiClient/interceptor'

const Tenant = () => {
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
      await getTenants()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update tenant.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Move tenant out
  const handleMoveOut = async (tenant) => {
    const confirmed = window.confirm(
      `Are you sure you want to move out ${tenant.fullName}?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await apiClient.patch(
        `/property/${tenant.property}/tenants/${tenant._id}/move-out`
      )

      setSuccess(`${tenant.fullName} has been moved out successfully.`)
      await getTenants()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to move out tenant.'
      )
    }
  }

  const displayedTenants =
    activeSection === 'active' ? tenants : history

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
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

      {/* Active tenants and history sections */}
      <div className="mb-5 flex flex-wrap gap-3 border-b border-gray-200 dark:border-stone-800">
        <button
          type="button"
          onClick={() => {
            setActiveSection('active')
            setError('')
            setSuccess('')
          }}
          className={`border-b-2 px-4 py-3 font-medium ${activeSection === 'active'
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
          className={`border-b-2 px-4 py-3 font-medium ${activeSection === 'history'
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
      ) : displayedTenants.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          {activeSection === 'active'
            ? 'No active tenants found across your properties.'
            : 'No previous tenants found across your properties.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xs border border-gray-200 dark:border-stone-800">
          <table className="w-full min-w-[850px] text-left text-sm">
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
              {displayedTenants.map((tenant) => (
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
                          className="rounded-xs bg-yellow-400 px-3 py-2 font-medium text-black hover:bg-yellow-500"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveOut(tenant)}
                          className="rounded-xs bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700"
                        >
                          Move Out
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
                className="text-2xl font-semibold text-gray-900 dark:text-white"
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

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-stone-800">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xs border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-stone-700 dark:text-gray-300 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xs bg-yellow-400 px-4 py-2 font-medium text-black hover:bg-yellow-500 disabled:opacity-50"
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
