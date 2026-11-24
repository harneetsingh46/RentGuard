import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";
import { notify } from "../../utils/notify";
import ImageSlider from "../../common/ImageSlider.jsx";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Send,
  X,
  AlertCircle,
  FileCheck,
  Ban,
} from "lucide-react";

const BrowseRentals = () => {
  const [activeTab, setActiveTab] = useState("listings"); // "listings" | "applications"
  const [listings, setListings] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [moveOutStatus, setMoveOutStatus] = useState("none");

  // Apply Modal state
  const [applyModal, setApplyModal] = useState({
    open: false,
    unit: null,
    property: null,
    moveInDate: "",
    message: "",
  });
  const [submittingApply, setSubmittingApply] = useState(false);

  // Approval confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    request: null,
  });
  const [processingConfirm, setProcessingConfirm] = useState(false);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  // Fetch available listings
  const fetchListings = async () => {
    try {
      const res = await apiClient.get("/tenant/available-listings");
      setListings(res.data.data || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      notify.error(err.response?.data?.message || "Failed to load rental listings.");
    }
  };

  // Fetch my rental applications
  const fetchMyApplications = async (knownUnit = currentUnit) => {
    try {
      const res = await apiClient.get("/rental-request/my-requests");
      const apps = res.data.data || [];
      setMyApplications(apps);

      const approvedApps = apps.filter((a) => a.status === "Approved");
      const isLocked = Boolean(knownUnit);
      if (!isLocked && approvedApps.length === 1 && !confirmModal.open) {
        setConfirmModal({
          open: true,
          request: approvedApps[0],
        });
      }
    } catch (err) {
      console.error("Error fetching my applications:", err);
    }
  };

  // Fetch tenant current tenancy and move-out status
  const fetchTenantStatus = async () => {
    try {
      const [dashRes, moveOutRes] = await Promise.allSettled([
        apiClient.get("/tenant/dashboard"),
        apiClient.get("/tenant/me/move-out-request"),
      ]);

      let unitObj = null;
      if (dashRes.status === "fulfilled") {
        unitObj = dashRes.value.data.data?.unit || null;
        setCurrentUnit(unitObj);
      }
      if (moveOutRes.status === "fulfilled") {
        const raw = moveOutRes.value.data.data;
        const mo = raw?.moveOutRequest || raw;
        setMoveOutStatus(mo?.status || "none");
      }
      return unitObj;
    } catch (err) {
      console.error("Error fetching tenant tenancy status:", err);
      return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    const unitObj = await fetchTenantStatus();
    await Promise.all([fetchListings(), fetchMyApplications(unitObj)]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter listings by property name, address, unit name, unit type, description, or facilities
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings
      .map((p) => {
        const propNameMatches = (p.propertyName || "").toLowerCase().includes(q);
        const addressMatches = (p.address || "").toLowerCase().includes(q);

        const matchingUnits = (p.availableUnits || []).filter((u) => {
          if (propNameMatches || addressMatches) return true;
          const unitNameMatches = (u.unitName || "").toLowerCase().includes(q);
          const unitTypeMatches = (u.unitType || "").toLowerCase().includes(q);
          const descMatches = (u.description || "").toLowerCase().includes(q);
          const facilityMatches = (u.facilities || []).some((f) =>
            (f || "").toLowerCase().includes(q)
          );
          return (
            unitNameMatches ||
            unitTypeMatches ||
            descMatches ||
            facilityMatches
          );
        });

        if (matchingUnits.length === 0) return null;
        return { ...p, availableUnits: matchingUnits };
      })
      .filter(Boolean);
  }, [listings, searchQuery]);

  const unitCards = useMemo(
    () =>
      filteredListings.flatMap((prop) =>
        (prop.availableUnits || []).map((u) => ({ prop, u }))
      ),
    [filteredListings]
  );

  // Open apply modal for a unit
  const openApplyModal = (property, unit) => {
    if (currentUnit && moveOutStatus !== "pending") {
      notify.error(
        `You currently rent ${currentUnit.unitName || "a unit"}. Submit a move-out request from your dashboard to apply for another property.`
      );
      return;
    }

    // Check if tenant already has an active application for this unit
    const existing = myApplications.find(
      (a) =>
        (a.unit?._id === unit._id || a.unit === unit._id) &&
        ["Pending", "Approved"].includes(a.status)
    );
    if (existing) {
      notify.error(`You already have an active application (${existing.status}) for this unit.`);
      return;
    }

    // Default move-in date: 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateStr = nextWeek.toISOString().split("T")[0];

    setApplyModal({
      open: true,
      unit,
      property,
      moveInDate: dateStr,
      message: "",
    });
  };

  // Submit application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyModal.unit?._id) return;

    try {
      setSubmittingApply(true);
      await apiClient.post("/rental-request", {
        unitId: applyModal.unit._id,
        moveInDate: applyModal.moveInDate || undefined,
        message: applyModal.message.trim() || undefined,
      });

      notify.success("Rental application submitted successfully!");
      setApplyModal({
        open: false,
        unit: null,
        property: null,
        moveInDate: "",
        message: "",
      });
      await fetchMyApplications();
      setActiveTab("applications");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to submit rental application.");
    } finally {
      setSubmittingApply(false);
    }
  };

  // Cancel my application
  const handleCancelApplication = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) return;

    try {
      await apiClient.patch(`/rental-request/${requestId}/cancel`);
      notify.success("Application cancelled successfully.");
      await fetchMyApplications();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to cancel application.");
    }
  };

  // Confirm & Accept lease
  const handleConfirmAcceptLease = async () => {
    if (!confirmModal.request?._id) return;

    try {
      setProcessingConfirm(true);
      const res = await apiClient.patch(`/rental-request/${confirmModal.request._id}/accept`);
      notify.success(
        res.data.message ||
        "Congratulations! Lease confirmed. Other applications have been cancelled."
      );
      setConfirmModal({ open: false, request: null });
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to confirm lease.");
    } finally {
      setProcessingConfirm(false);
    }
  };

  // Decline approved offer
  const handleDeclineOffer = async (requestId) => {
    if (!window.confirm("Are you sure you want to decline this rental offer?")) return;

    try {
      setProcessingConfirm(true);
      await apiClient.patch(`/rental-request/${requestId}/decline`);
      notify.success("Rental offer declined.");
      setConfirmModal({ open: false, request: null });
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to decline offer.");
    } finally {
      setProcessingConfirm(false);
    }
  };

  const approvedOffers = useMemo(
    () => myApplications.filter((a) => a.status === "Approved"),
    [myApplications]
  );

  return (
    <div className="min-h-screen bg-[#f7f5f0] p-4 text-[#171717] sm:p-8 dark:bg-[#101010] dark:text-[#F1F0ED]">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Find Your Next Home
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-[#A5A5A5]">
            Explore verified properties with available units and apply directly.
          </p>
        </div>

        {/* Approved Offer Banner */}
        {approvedOffers.length > 0 && (
          <div className="mb-6 rounded-xs border-2 border-yellow-400 bg-yellow-50 p-4 shadow-md dark:border-yellow-500 dark:bg-yellow-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileCheck className="mt-0.5 h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  {approvedOffers.length > 1 ? (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-yellow-300">
                        You have {approvedOffers.length} lease offers awaiting confirmation
                      </h3>
                      <p className="text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                        Multiple property owners have approved your applications. Review and manage all offers from your dashboard.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-yellow-300">
                        Action Required: Your Rental Application is Approved!
                      </h3>
                      <p className="text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                        The owner approved your request for{" "}
                        <span className="font-semibold">{approvedOffers[0].unit?.unitName}</span> at{" "}
                        <span className="font-semibold">{approvedOffers[0].property?.propertyName}</span>. Confirm your lease to move in.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                {approvedOffers.length > 1 ? (
                  <Link
                    to="/tenant/dashboard"
                    className="rounded-xs bg-yellow-300 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-400 shadow inline-flex items-center"
                  >
                    View Offers on Dashboard &rarr;
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(currentUnit) || processingConfirm}
                      onClick={() => setConfirmModal({ open: true, request: approvedOffers[0] })}
                      className="rounded-xs bg-yellow-300 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 disabled:opacity-70 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400 shadow"
                    >
                      Confirm & Accept Lease
                    </button>
                    {currentUnit && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Available after your current owner approves your move-out.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Tenancy / Move-out Banner */}
        {currentUnit && moveOutStatus !== "pending" && (
          <div className="mb-6 rounded-xs border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-600/40 dark:bg-amber-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  You currently rent <span className="font-semibold">{currentUnit.unitName || "a unit"}</span>. Submit a move-out request from your dashboard to apply for another property.
                </p>
              </div>
              <Link
                to="/tenant/dashboard"
                className="inline-flex shrink-0 items-center justify-center rounded-xs bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-500 shadow-sm"
              >
                Go to Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {currentUnit && moveOutStatus === "pending" && (
          <div className="mb-6 rounded-xs border border-blue-300 bg-blue-50 p-4 shadow-sm dark:border-blue-600/40 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Your move-out request is pending. You can apply now, but you can confirm a new lease only after your owner approves your move-out.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-3 dark:border-neutral-800">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={`pb-2 text-sm font-semibold transition border-b-2 ${activeTab === "listings"
                ? "border-yellow-400 text-yellow-600 dark:text-yellow-400"
                : "border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
            >
              Available Units ({unitCards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("applications")}
              className={`pb-2 text-sm font-semibold transition border-b-2 ${activeTab === "applications"
                ? "border-yellow-400 text-yellow-600 dark:text-yellow-400"
                : "border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
            >
              My Applications ({myApplications.length})
            </button>
          </div>

          {activeTab === "listings" && (
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties or city..."
                className="w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-xs text-black placeholder:text-gray-400 focus:border-black focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === "listings" && (
          <div>
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading available rental properties...
              </div>
            ) : unitCards.length === 0 ? (
              <div className="rounded-xs border border-stone-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <Home className="mx-auto h-10 w-10 text-stone-400" />
                <h3 className="mt-3 text-base font-semibold">No Available Listings Found</h3>
                <p className="mt-1 text-xs text-stone-500">
                  {searchQuery ? "Try clearing your search query." : "All units are currently occupied. Check back soon!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {unitCards.map(({ prop, u }) => (
                  <div
                    key={u._id}
                    className="flex flex-col overflow-hidden rounded-xs border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-[#171717]"
                  >
                    {/* ImageSlider full width, h-48 */}
                    <div className="w-full h-48 shrink-0 bg-gray-100 dark:bg-neutral-800">
                      <ImageSlider
                        images={
                          Array.isArray(u.images) && u.images.length > 0
                            ? u.images
                            : u.image?.url
                              ? [u.image]
                              : []
                        }
                        className="w-full h-48"
                        fitClass="object-cover"
                        onImageClick={(index) =>
                          setLightbox({
                            images:
                              Array.isArray(u.images) && u.images.length > 0
                                ? u.images
                                : u.image?.url
                                  ? [u.image]
                                  : [],
                            initialIndex: index,
                          })
                        }
                      />
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      {/* Header row: unit name and type on left, rent on right */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {u.unitName}
                          </h3>
                          <p className="mt-0.5 text-xs capitalize text-stone-500 dark:text-neutral-400">
                            {u.unitType || "Residential"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            ₹{Number(u.rent || 0).toLocaleString("en-IN")}
                          </p>
                          <span className="text-xs font-normal text-stone-500 dark:text-neutral-400">
                            {" "}/ month
                          </span>
                        </div>
                      </div>

                      {/* Property, Address, Owner */}
                      <div className="mt-3 space-y-1 text-xs text-stone-500 dark:text-[#A5A5A5]">
                        <p className="font-medium text-stone-800 dark:text-stone-200">
                          {prop.propertyName}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{prop.address}</span>
                        </p>
                        <p>
                          Owner:{" "}
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {prop.owner?.username || "Not available"}
                          </span>
                        </p>
                      </div>

                      {/* Description */}
                      {u.description && (
                        <p className="mt-3 line-clamp-3 text-xs text-stone-600 dark:text-stone-300">
                          {u.description}
                        </p>
                      )}

                      {/* Facility chips */}
                      {Array.isArray(u.facilities) && u.facilities.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {u.facilities.slice(0, 4).map((facility, fIdx) => (
                            <span
                              key={fIdx}
                              className="inline-flex items-center rounded-xs border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-stone-300"
                            >
                              {facility}
                            </span>
                          ))}
                          {u.facilities.length > 4 && (
                            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                              +{u.facilities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Apply button full width at bottom */}
                      <div className="mt-auto pt-4">
                        {(() => {
                          const existingApp = myApplications.find(
                            (a) =>
                              (a.unit?._id === u._id || a.unit === u._id) &&
                              ["Pending", "Approved"].includes(a.status)
                          );

                          const isBlockedByCurrentUnit = Boolean(
                            currentUnit && moveOutStatus !== "pending"
                          );
                          const isDisabled = Boolean(existingApp || isBlockedByCurrentUnit);

                          const buttonLabel =
                            existingApp?.status === "Pending"
                              ? "Applied"
                              : existingApp?.status === "Approved"
                                ? "Approved"
                                : "Apply to Rent";

                          return (
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => openApplyModal(prop, u)}
                              className={`w-full inline-flex items-center justify-center gap-1 rounded-xs px-3 py-2 text-xs font-semibold transition ${
                                isDisabled
                                  ? "cursor-not-allowed bg-stone-200 text-stone-500 opacity-70 dark:bg-neutral-800 dark:text-neutral-400"
                                  : "bg-yellow-300 text-black hover:bg-yellow-400"
                              }`}
                            >
                              {buttonLabel}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS */}
        {activeTab === "applications" && (
          <div>
            {myApplications.length === 0 ? (
              <div className="rounded-xs border border-stone-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <Clock3 className="mx-auto h-10 w-10 text-stone-400" />
                <h3 className="mt-3 text-base font-semibold">No Applications Yet</h3>
                <p className="mt-1 text-xs text-stone-500">
                  You haven't submitted any rental applications yet. Browse available properties to get started!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("listings")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xs bg-yellow-300 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-400"
                >
                  Browse Listings
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {myApplications.map((app) => (
                  <div
                    key={app._id}
                    className={`rounded-xs border p-5 shadow-sm transition ${app.status === "Approved"
                      ? "border-yellow-400 bg-yellow-50/40 dark:border-yellow-500/60 dark:bg-yellow-950/20"
                      : "border-stone-200 bg-white dark:border-neutral-800 dark:bg-[#171717]"
                      }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {app.unit?.unitName || "Unit"} · {app.property?.propertyName || "Property"}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {app.property?.address}
                        </p>
                      </div>

                      <span
                        className={`rounded-xs px-2.5 py-1 text-xs font-semibold capitalize ${app.status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                          : app.status === "Approved"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                            : app.status === "Accepted"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                              : "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300 border border-gray-300"
                          }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-stone-400 uppercase tracking-wider block">Monthly Rent</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          ₹{Number(app.unit?.rent || 0).toLocaleString("en-IN")} / mo
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase tracking-wider block">Move-in Date</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {app.moveInDate ? new Date(app.moveInDate).toLocaleDateString() : "Immediate"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase tracking-wider block">Applied On</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 uppercase tracking-wider block">Unit Type</span>
                        <span className="text-gray-700 capitalize dark:text-gray-300">
                          {app.unit?.unitType || "Residential"}
                        </span>
                      </div>
                    </div>

                    {app.message && (
                      <p className="mt-3 rounded bg-stone-50 p-2 text-xs text-stone-600 dark:bg-neutral-800/60 dark:text-stone-400">
                        <span className="font-semibold">Your note:</span> {app.message}
                      </p>
                    )}

                    {app.rejectionReason && (
                      <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        <span className="font-semibold">Reason:</span> {app.rejectionReason}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 pt-3 dark:border-neutral-800">
                      {app.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleCancelApplication(app._id)}
                          className="rounded-xs border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          Cancel Application
                        </button>
                      )}

                      {app.status === "Approved" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeclineOffer(app._id)}
                            className="rounded-xs border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            Decline Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ open: true, request: app })}
                            className="inline-flex items-center gap-1.5 rounded-xs bg-yellow-300 px-4 py-1.5 text-xs font-bold text-black hover:bg-yellow-400 shadow"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirm & Accept Lease
                          </button>
                        </>
                      )}

                      {app.status === "Accepted" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Lease Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* APPLY MODAL */}
        {applyModal.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={() => {
              if (!submittingApply) {
                setApplyModal({
                  open: false,
                  unit: null,
                  property: null,
                  moveInDate: "",
                  message: "",
                });
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-lg rounded-xs border border-stone-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#1b1b1b]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Apply to Rent Unit
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setApplyModal({
                      open: false,
                      unit: null,
                      property: null,
                      moveInDate: "",
                      message: "",
                    })
                  }
                  disabled={submittingApply}
                  className="text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="mt-4 space-y-4">
                <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {applyModal.property?.propertyName} — {applyModal.unit?.unitName}
                  </p>
                  <p className="text-stone-500 mt-0.5">
                    Monthly Rent: <span className="font-medium text-black dark:text-white">₹{Number(applyModal.unit?.rent || 0).toLocaleString("en-IN")}/mo</span>
                  </p>
                  <p className="text-stone-500">
                    Address: {applyModal.property?.address}
                  </p>
                </div>

                <div>
                  <label htmlFor="moveInDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Desired Move-in Date
                  </label>
                  <input
                    id="moveInDate"
                    type="date"
                    required
                    min={todayStr}
                    value={applyModal.moveInDate}
                    onChange={(e) =>
                      setApplyModal((prev) => ({ ...prev, moveInDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded border border-stone-300 bg-white p-2.5 text-xs text-black outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="applyMessage" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Message to Owner <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="applyMessage"
                    rows={3}
                    value={applyModal.message}
                    onChange={(e) =>
                      setApplyModal((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Introduce yourself or mention any specific questions or move-in timeline..."
                    className="mt-1 w-full rounded border border-stone-300 bg-white p-2.5 text-xs text-black outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setApplyModal({
                        open: false,
                        unit: null,
                        property: null,
                        moveInDate: "",
                        message: "",
                      })
                    }
                    disabled={submittingApply}
                    className="rounded-xs border border-stone-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-stone-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="inline-flex items-center gap-1.5 rounded-xs bg-yellow-300 px-5 py-2 text-xs font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submittingApply ? "Submitting..." : "Send Rental Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* APPROVAL CONFIRMATION MODAL */}
        {confirmModal.open && confirmModal.request && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
            onClick={() => {
              if (!processingConfirm) setConfirmModal({ open: false, request: null });
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-lg rounded-xs border-2 border-yellow-400 bg-white p-6 shadow-2xl dark:border-yellow-500 dark:bg-[#1c1b18]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Confirm Your Rental Lease
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, request: null })}
                  disabled={processingConfirm}
                  className="text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Congratulations! The owner has approved your application for{" "}
                  <span className="font-bold text-black dark:text-white">
                    {confirmModal.request.unit?.unitName}
                  </span>{" "}
                  at{" "}
                  <span className="font-bold text-black dark:text-white">
                    {confirmModal.request.property?.propertyName}
                  </span>
                  .
                </p>

                <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 block">Monthly Rent</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        ₹{Number(confirmModal.request.unit?.rent || 0).toLocaleString("en-IN")}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Move-in Date</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {confirmModal.request.moveInDate
                          ? new Date(confirmModal.request.moveInDate).toLocaleDateString()
                          : "Immediate"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-600/40 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    Important Terms of Acceptance:
                  </p>
                  <p className="mt-1">
                    Upon clicking <strong>Confirm & Accept Lease</strong>, you will officially be assigned to this unit and your tenancy will activate immediately. <strong>All other active or pending rental requests submitted by you will be automatically cancelled.</strong>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeclineOffer(confirmModal.request._id)}
                  disabled={processingConfirm}
                  className="rounded-xs border border-stone-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-stone-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Decline Offer
                </button>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={handleConfirmAcceptLease}
                    disabled={Boolean(currentUnit) || processingConfirm}
                    className="inline-flex items-center justify-center gap-2 rounded-xs bg-yellow-300 px-5 py-2.5 text-xs font-bold text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 disabled:opacity-70 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400 shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {processingConfirm ? "Activating Tenancy..." : "Confirm & Accept Lease"}
                  </button>
                  {currentUnit && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Available after your current owner approves your move-out.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* UNIT IMAGE VIEWER LIGHTBOX */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Unit image viewer"
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close image viewer"
                className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-2 text-gray-800 shadow-lg transition hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="max-h-[85vh] w-full overflow-hidden rounded-xl bg-black">
                <ImageSlider
                  images={lightbox.images}
                  initialIndex={lightbox.initialIndex}
                  className="max-h-[85vh] h-[70vh] w-full"
                  fitClass="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseRentals;

