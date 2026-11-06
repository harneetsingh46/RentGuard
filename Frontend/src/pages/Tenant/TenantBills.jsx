
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";


const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const TenantBills = () => {
  const [paying, setPaying] = useState(false);
  const [bills, setBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");

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

  // Fetch existing pending orders
  const fetchPendingOrder = async () => {
    try {
      const { data } = await apiClient.get("/order/my-orders");

      const orders = data.data || [];

      const pendingOrder = orders.find(
        (order) =>
          order.status === "pending" &&
          new Date(order.expiresAt).getTime() > Date.now()
      );

      setCreatedOrder(pendingOrder || null);
    } catch (err) {
      console.error("Unable to fetch existing orders:", err);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchPendingOrder();
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
    setCreatedOrder(null);
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
    setCreatedOrder(null);
  };

  // Create combined Order
  const handleCreateOrder = async () => {
    if (selectedBills.length === 0) {
      setError("Please select at least one bill.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setCreatedOrder(null);

      const { data } = await apiClient.post("/order/create", {
        billIds: selectedBills,
      });

      setCreatedOrder(data.data);
      setSuccess("Your Order has been created successfully!");
      setSelectedBills([]);

      // Refresh bills because selected bills are now reserved
      await fetchBills();

    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!createdOrder?._id || paying) return;

    try {
      setPaying(true);
      setError("");
      setSuccess("");

      // Load Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay. Please try again.");
      }

      // Create Razorpay order through backend
      const { data } = await apiClient.post(
        `/payment/${createdOrder._id}/order`
      );

      const paymentOrder = data.data;

      if (!paymentOrder?.orderId) {
        throw new Error("Unable to create payment order.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "RentGuard",
        description: "Rent and Bill Payment",
        order_id: paymentOrder.orderId,

        notes: {
          rentGuardOrderId: createdOrder._id,
        },

        theme: {
          color: "#f9c83d",
        },

        handler: async (response) => {
          try {
            // Verify payment through backend
            await apiClient.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setCreatedOrder((previous) =>
              previous ? { ...previous, status: "paid" } : previous
            );

            setSuccess("Payment completed successfully!");

            setSelectedBills([]);

            // Refresh transactions and locate the payment just completed.
            const [, refreshedPayments] = await Promise.all([
              fetchBills(),
              fetchPayments(),
            ]);

            const completedPayment = refreshedPayments.find(
              (payment) =>
                payment.razorpayPaymentId === response.razorpay_payment_id &&
                payment.status === "paid"
            );

            if (completedPayment) {
              setReceiptPayment(completedPayment);
              setReceiptError("");
            } else {
              setReceiptError(
                "Payment succeeded, but the receipt could not be prepared. You can download it from Recent Transactions."
              );
            }
          } catch (err) {
            setError(
              err.response?.data?.message ||
              "Payment verification failed. Please contact support before trying again."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
          "Payment failed. Please try again."
        );
        setPaying(false);
      });

      razorpay.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to start payment."
      );

      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-6 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Tenant Portal / Bills
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Bills
            </h1>

            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              View your bills and select the ones you want to pay.
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

          {/* Unpaid Bills */}
          <div className="rounded-xs bg-[#141414] p-6 text-white shadow-sm">
            <p className="text-sm text-neutral-400">
              Unpaid Bills
            </p>

            <h2 className="mt-4 text-4xl font-semibold">
              {loading ? "—" : bills.length}
            </h2>

            <p className="mt-6 border-t border-white/10 pt-4 text-xs text-neutral-400">
              Bills awaiting payment
            </p>
          </div>

          {/* Selected Bills */}
          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Selected Bills
            </p>

            <h2 className="mt-4 text-4xl font-semibold">
              {selectedBills.length}
            </h2>

            <p className="mt-6 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Bills selected for checkout
            </p>
          </div>

          {/* Selected Total */}
          <div className="rounded-xs border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Selected Total
            </p>

            <h2 className="mt-4 text-3xl font-semibold">
              {formatCurrency(totalAmount)}
            </h2>

            <p className="mt-6 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Combined amount of selected bills
            </p>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="mb-6 overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="border-b border-neutral-100 p-6 dark:border-neutral-800 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">
              Recent Transactions
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-[#faf9f6] dark:bg-[#1d1d1d]">
                  <tr className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="px-6 py-4 font-medium">Transaction</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {[...payments]
                    .sort(
                      (a, b) =>
                        new Date(b.paidAt || b.createdAt) -
                        new Date(a.paidAt || a.createdAt)
                    )
                    .slice(0, 5)
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
                            {payment.razorpayPaymentId || "Payment record"}
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
                            className={`inline-flex rounded-xs px-3 py-1.5 text-xs font-medium capitalize ${
                              payment.status === "paid"
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

        {/* Bills Section */}
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
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 md:hidden">
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

        {/* Created Order Confirmation */}
        {createdOrder && (
          <section className="mt-6 rounded-xs border border-green-200 bg-white p-6 shadow-sm dark:border-green-900 dark:bg-[#171717] sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                  Order Created
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Your Order is ready
                </h2>

                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Order ID: {createdOrder._id}
                </p>
              </div>

              <span className="w-fit rounded-xs bg-amber-50 px-4 py-2 text-xs font-semibold capitalize text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
                {createdOrder.status}
              </span>
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Total Order Amount
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(createdOrder.totalAmount)}
              </p>

              {createdOrder.status === "paid" ? (
                <p className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400">
                  Payment completed successfully.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                    Your selected bills are reserved for this order. Complete payment
                    to mark them as paid.
                  </p>

                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paying}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paying ? "Processing Payment..." : "Pay Now"}
                    {!paying && <span aria-hidden="true">→</span>}
                  </button>
                </>
              )}
            </div>
          </section>
        )}

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

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          RentGuard Tenant Portal · Bills
        </footer>

      </div>
    </div>
  );
};

export default TenantBills;
