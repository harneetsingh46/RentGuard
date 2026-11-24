
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";
import notify from "../../utils/notify";

const TenantBills = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payments, setPayments] = useState([]);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [activeTab, setActiveTab] = useState("bills");

  // Fetch tenant's unpaid bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await apiClient.get("/order/unpaid-bills");

      setBills(data.data || []);

    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch bills."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenant's recent payment transactions
  const fetchPayments = async () => {
    try {
      const { data } = await apiClient.get("/payment/my-payments");
      const paymentList = data.data || [];
      setPayments(paymentList);
      return paymentList;
    } catch (err) {
      console.error("Unable to fetch payment history:", err);
      return [];
    }
  };

  // Fetch tenant's orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data } = await apiClient.get("/order/my-orders");
      setOrders(data.data || []);
      return data.data || [];
    } catch (err) {
      console.error("Unable to fetch existing orders:", err);
      return [];
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchOrders();
    fetchPayments();
  }, []);

  // Format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Open or download a paid payment receipt
  const handleReceiptAction = async (payment, action = "download") => {
    if (!payment?._id || downloadingReceipt) return;

    let blobUrl;

    try {
      setDownloadingReceipt(true);
      setReceiptError("");

      const response = await apiClient.get(
        `/payment/my-payments/${payment._id}/receipt`,
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });
      blobUrl = window.URL.createObjectURL(pdfBlob);

      if (action === "view") {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `RentGuard-Receipt-${payment._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setReceiptPayment(null);
      }

      window.setTimeout(() => {
        if (blobUrl) window.URL.revokeObjectURL(blobUrl);
      }, 60_000);
    } catch (err) {
      console.error("Receipt action error:", err);
      setReceiptError(
        action === "view"
          ? "Unable to open the receipt. Please try again."
          : "Unable to download the receipt. Please try again."
      );
    } finally {
      setDownloadingReceipt(false);
    }
  };

  // Format billing period
  const formatPeriod = (month, year) => {
    if (!month || !year) return "—";

    return new Date(year, month - 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // Calculate selected bills
  const selectedBillDetails = useMemo(
    () =>
      bills.filter((bill) =>
        selectedBills.includes(bill._id)
      ),
    [bills, selectedBills]
  );

  // Calculate total amount
  const totalAmount = useMemo(
    () =>
      selectedBillDetails.reduce(
        (total, bill) => total + Number(bill.amount || 0),
        0
      ),
    [selectedBillDetails]
  );

  // Select or deselect a bill
  const toggleBill = (billId) => {
    setSelectedBills((previous) =>
      previous.includes(billId)
        ? previous.filter((id) => id !== billId)
        : [...previous, billId]
    );

    setError("");
    setSuccess("");
  };

  // Select all bills
  const toggleSelectAll = () => {
    if (selectedBills.length === bills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map((bill) => bill._id));
    }

    setError("");
    setSuccess("");
  };

  // Create combined Order
  const handleCreateOrder = async () => {
    if (selectedBills.length === 0) {
      notify.error("Please select at least one bill.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const { data } = await apiClient.post("/order/create", {
        billIds: selectedBills,
      });

      setSelectedBills([]);
      notify.success("Order created successfully.");
      navigate(`/tenant/pay/${data.data._id}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Unable to create order.";
      setError(errMsg);
      notify.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            My Bills
          </h1>

          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            View your bills and select the ones you want to pay.
          </p>
        </div>

        {/* Bills, orders, and transaction history tabs */}
        <div className="mb-6 flex gap-2 border-b border-neutral-200 dark:border-neutral-800" role="tablist" aria-label="Bill sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bills"}
            onClick={() => setActiveTab("bills")}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === "bills"
              ? "border-[#f9c83d] text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
          >
            Pay Bills
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === "orders"
              ? "border-[#f9c83d] text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
          >
            Order History
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
              {orders.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === "transactions"
              ? "border-[#f9c83d] text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
          >
            Transaction History
            <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
              {payments.length}
            </span>
          </button>
        </div>

        {/* Order History tab content */}
        {activeTab === "orders" && (
          <section className="mb-6 overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
            <div className="border-b border-neutral-100 p-6 dark:border-neutral-800 sm:p-7">
              <h2 className="text-xl font-semibold tracking-tight">
                Order History
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Track your combined payment orders and resume pending checkouts.
              </p>
            </div>

            {loadingOrders ? (
              <div className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No orders yet. When you create an order to pay bills, it will appear here.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [scrollbar-color:#d6d3d1_transparent] dark:[scrollbar-color:#404040_transparent]">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="sticky top-0 z-10 bg-[#faf9f6] dark:bg-[#1d1d1d]">
                    <tr className="bg-[#faf9f6] text-xs uppercase tracking-wider text-neutral-500 dark:bg-[#1d1d1d] dark:text-neutral-400">
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Order ID</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Date</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Bills</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Amount</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Status</th>
                      <th className="bg-[#faf9f6] px-6 py-4 text-right font-medium dark:bg-[#1d1d1d]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const isPending =
                        order.status === "pending" &&
                        (!order.expiresAt || new Date(order.expiresAt).getTime() > Date.now());

                      return (
                        <tr
                          key={order._id}
                          className="border-t border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs">{order._id}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {order.items?.length || 0} bill(s)
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-xs px-3 py-1.5 text-xs font-medium capitalize ${
                                order.status === "paid"
                                  ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                                  : order.status === "pending"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                                  : order.status === "cancelled"
                                  ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                  : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPending ? (
                              <Link
                                to={`/tenant/pay/${order._id}`}
                                className="inline-flex items-center gap-1 rounded-xs bg-[#f9c83d] px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-[#edbb2e]"
                              >
                                Pay Now →
                              </Link>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Transaction History tab content */}
        {activeTab === "transactions" && (
          <section className="mb-6 overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
            <div className="border-b border-neutral-100 p-6 dark:border-neutral-800 sm:p-7">
              <h2 className="text-xl font-semibold tracking-tight">
                Transaction History
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Your latest rent and bill payments.
              </p>
            </div>

            {payments.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No transactions yet. Your completed payments will appear here.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [scrollbar-color:#d6d3d1_transparent] dark:[scrollbar-color:#404040_transparent]">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="sticky top-0 z-10 bg-[#faf9f6] dark:bg-[#1d1d1d]">
                    <tr className="bg-[#faf9f6] text-xs uppercase tracking-wider text-neutral-500 dark:bg-[#1d1d1d] dark:text-neutral-400">
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Transaction</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Date</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Amount</th>
                      <th className="bg-[#faf9f6] px-6 py-4 font-medium dark:bg-[#1d1d1d]">Status</th>
                      <th className="bg-[#faf9f6] px-6 py-4 text-right font-medium dark:bg-[#1d1d1d]">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...payments]
                      .sort(
                        (a, b) =>
                          new Date(b.paidAt || b.createdAt) -
                          new Date(a.paidAt || a.createdAt)
                      )
                      .map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-t border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium">
                              {payment.order?.items?.length || 0} bill(s)
                            </p>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                              {payment.method === "cash"
                                ? `Cash (${formatDate(payment.receivedOn || payment.paidAt || payment.createdAt)})`
                                : payment.razorpayPaymentId || "Payment record"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-xs px-3 py-1.5 text-xs font-medium capitalize ${payment.status === "paid"
                                ? "bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-400"
                                : payment.status === "failed"
                                  ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"
                                }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {payment.status === "paid" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReceiptAction(payment, "view")}
                                  disabled={downloadingReceipt}
                                  className="border border-neutral-300 px-3 py-2 text-xs font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                >
                                  View receipt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReceiptAction(payment, "download")}
                                  disabled={downloadingReceipt}
                                  className="border border-neutral-300 px-3 py-2 text-xs font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                >
                                  Download
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Immediate Receipt Prompt */}
        {receiptPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-prompt-title"
          >
            <div className="w-full max-w-md rounded-xs border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-[#171717] sm:p-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600 dark:bg-green-400/10 dark:text-green-400">
                ✓
              </div>

              <h2
                id="receipt-prompt-title"
                className="mt-4 text-center text-xl font-semibold"
              >
                Payment successful!
              </h2>

              <p className="mt-2 text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Your payment of{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(receiptPayment.amount)}
                </span>{" "}
                has been confirmed. Would you like to download your receipt now?
              </p>

              {receiptError && (
                <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
                  {receiptError}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPayment(null);
                    setReceiptError("");
                  }}
                  disabled={downloadingReceipt}
                  className="flex-1 border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleReceiptAction(receiptPayment, "view")}
                  disabled={downloadingReceipt}
                  className="flex-1 border border-neutral-300 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {downloadingReceipt ? "Opening..." : "View receipt"}
                </button>

                <button
                  type="button"
                  onClick={() => handleReceiptAction(receiptPayment, "download")}
                  disabled={downloadingReceipt}
                  className="flex-1 bg-[#f9c83d] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingReceipt ? "Preparing..." : "Download receipt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xs border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <p>{error}</p>

            <button
              onClick={() => setError("")}
              className="font-semibold"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-5 rounded-xs border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
            {success}
          </div>
        )}
        {receiptError && !receiptPayment && (
          <p className="mb-5 text-sm text-red-600 dark:text-red-400">
            {receiptError}
          </p>
        )}

        {/* Bills tab content */}
        {activeTab === "bills" && (
          <>
            <section className="overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">

              <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 p-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:p-7">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Unpaid Bills
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Select one or more bills to create a combined Order.
                  </p>
                </div>

                {bills.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="w-fit rounded-xs border border-neutral-200 px-4 py-2 text-xs font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    {selectedBills.length === bills.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              {/* Loading */}
              {loading ? (
                <div className="px-6 py-16 text-center text-sm text-neutral-500">
                  Loading your bills...
                </div>
              ) : bills.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600 dark:bg-green-400/10 dark:text-green-400">
                    ✓
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">
                    No unpaid bills
                  </h3>

                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    You don't have any unpaid bills at the moment.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[750px] text-left">
                      <thead className="bg-[#faf9f6] dark:bg-[#1d1d1d]">
                        <tr className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          <th className="px-6 py-4 font-medium">
                            Select
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Bill
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Period
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Due Date
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Amount
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {bills.map((bill) => (
                          <tr
                            key={bill._id}
                            className="border-t border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-[#1d1d1d]"
                          >
                            <td className="px-6 py-5">
                              <input
                                type="checkbox"
                                checked={selectedBills.includes(bill._id)}
                                onChange={() => toggleBill(bill._id)}
                                className="h-4 w-4 cursor-pointer accent-[#f9c83d]"
                              />
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-medium">
                                {bill.billName}
                              </p>

                              <p className="mt-1 text-xs capitalize text-neutral-500 dark:text-neutral-400">
                                {bill.category}
                              </p>
                            </td>

                            <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                              {formatPeriod(bill.month, bill.year)}
                            </td>

                            <td className="px-6 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                              {formatDate(bill.dueDate)}
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold">
                              {formatCurrency(bill.amount)}
                            </td>

                            <td className="px-6 py-5">
                              <span className="inline-flex rounded-xs bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                                Unpaid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="max-h-[420px] divide-y divide-neutral-100 overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [scrollbar-color:#d6d3d1_transparent] dark:[scrollbar-color:#404040_transparent] dark:divide-neutral-800 md:hidden">
                    {bills.map((bill) => (
                      <label
                        key={bill._id}
                        className="flex cursor-pointer items-start gap-4 p-5 transition hover:bg-neutral-50 dark:hover:bg-[#1d1d1d]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(bill._id)}
                          onChange={() => toggleBill(bill._id)}
                          className="mt-1 h-4 w-4 accent-[#f9c83d]"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {bill.billName}
                              </p>

                              <p className="mt-1 text-xs capitalize text-neutral-500 dark:text-neutral-400">
                                {bill.category} · {formatPeriod(bill.month, bill.year)}
                              </p>
                            </div>

                            <p className="shrink-0 font-semibold">
                              {formatCurrency(bill.amount)}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>
                              Due: {formatDate(bill.dueDate)}
                            </span>

                            <span className="rounded-xs bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                              Unpaid
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Checkout Footer */}
              <div className="flex flex-col justify-between gap-5 border-t border-neutral-100 bg-[#faf9f6] p-6 dark:border-neutral-800 dark:bg-[#1d1d1d] sm:flex-row sm:items-center sm:px-7">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Total selected amount
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={
                    selectedBills.length === 0 ||
                    submitting ||
                    loading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Creating Order..."
                    : "Continue to Checkout"}

                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>

            {/* Information Sections */}
            <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

              <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f9c83d] text-xl text-black">
                    !
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Payment Information
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      Selecting bills creates one combined Order. Payment
                      will be handled securely through RentGuard's payment
                      system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xs border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#171717]">
                <h3 className="font-semibold">
                  Need Help?
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Have a question about a bill? Contact your property
                  manager for clarification.
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
          </>
        )}

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Payments
        </footer>

      </div>
    </div>
  );
};

export default TenantBills;
