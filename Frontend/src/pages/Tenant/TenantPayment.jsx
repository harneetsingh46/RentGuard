import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor";
import notify from "../../utils/notify";

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

const TenantPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPeriod = (month, year) => {
    if (!month || !year) return "—";
    const date = new Date(year, month - 1);
    return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await apiClient.get(`/order/${orderId}`);
      setOrder(data.data || null);
    } catch (err) {
      const msg = err.response?.data?.message || "Order not found.";
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Open or download payment receipt
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

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
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

  const handlePayment = async () => {
    if (!order?._id || paying) return;

    try {
      setPaying(true);
      setError("");

      // Load Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay. Please try again.");
      }

      // Create Razorpay order through backend
      const { data } = await apiClient.post(`/payment/${order._id}/order`);
      const paymentOrder = data.data;

      if (!paymentOrder?.orderId) {
        throw new Error("Unable to create payment order.");
      }

      let dismissalHandled = false;
      let paymentVerified = false;

      const handleCheckoutDismissal = async () => {
        if (dismissalHandled || paymentVerified) return;

        dismissalHandled = true;
        setPaying(false);

        try {
          const { data } = await apiClient.post(
            `/order/${order._id}/checkout-dismissed`
          );

          const result = data.data;

          if (result?.status === "cancelled") {
            setOrder((previous) =>
              previous ? { ...previous, status: "cancelled" } : previous
            );
            notify.info(
              "Your order was cancelled after two checkout dismissals. You can select your bills and create a new order."
            );
          } else if (result?.status === "retry_available") {
            notify.info(
              "Checkout closed. You have one more attempt to complete your payment."
            );
          } else if (result?.status === "paid") {
            notify.success("Your payment has already been completed.");
            setOrder((previous) =>
              previous ? { ...previous, status: "paid" } : previous
            );
          }

          await fetchOrder();
        } catch (err) {
          notify.error(
            err.response?.data?.message ||
              "Unable to confirm checkout status. Please refresh before trying again."
          );

          await fetchOrder();
        }
      };

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "RentGuard",
        description: "Rent and Bill Payment",
        order_id: paymentOrder.orderId,

        notes: {
          rentGuardOrderId: order._id,
        },

        theme: {
          color: "#f9c83d",
        },

        handler: async (response) => {
          try {
            // Verify payment through backend only once
            await apiClient.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Prevent checkout dismissal from being counted
            paymentVerified = true;

            setOrder((previous) =>
              previous ? { ...previous, status: "paid" } : previous
            );

            setPaymentSuccess(true);
            notify.success("Payment completed successfully!");

            // Fetch payment history to retrieve receipt
            try {
              const { data: payData } = await apiClient.get(
                "/payment/my-payments"
              );
              const paymentList = payData.data || [];
              const completedPayment = paymentList.find(
                (payment) =>
                  payment.razorpayPaymentId === response.razorpay_payment_id &&
                  payment.status === "paid"
              );

              if (completedPayment) {
                setReceiptPayment(completedPayment);
                setReceiptError("");
              }
            } catch (pErr) {
              console.error("Unable to locate receipt payment:", pErr);
            }
          } catch (err) {
            notify.error(
              err.response?.data?.message ||
                "Payment verification failed. Please contact support before trying again."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: handleCheckoutDismissal,
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        notify.error(
          response.error?.description || "Payment failed. Please try again."
        );
        setPaying(false);
      });

      razorpay.open();
    } catch (err) {
      notify.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment."
      );
      setPaying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-[#f9c83d]" />
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4 py-12 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="w-full max-w-md rounded-xs border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-400/10 dark:text-red-400">
            !
          </div>
          <h2 className="mt-4 text-xl font-semibold">Order Not Found</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {error || "The requested order could not be found or has been removed."}
          </p>
          <div className="mt-6">
            <Link
              to="/tenant/bills"
              className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">←</span>
              Back to bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment completed state
  if (paymentSuccess || order.status === "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4 py-12 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="w-full max-w-lg rounded-xs border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600 dark:bg-green-400/10 dark:text-green-400">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Payment Completed!</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Your payment of{" "}
            <span className="font-semibold text-neutral-900 dark:text-white">
              {formatCurrency(order.totalAmount)}
            </span>{" "}
            for Order #{order._id} has been processed successfully.
          </p>

          {receiptError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {receiptError}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {receiptPayment && (
              <>
                <button
                  type="button"
                  onClick={() => handleReceiptAction(receiptPayment, "view")}
                  disabled={downloadingReceipt}
                  className="rounded-xs border border-neutral-300 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {downloadingReceipt ? "Opening..." : "View Receipt"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReceiptAction(receiptPayment, "download")}
                  disabled={downloadingReceipt}
                  className="rounded-xs border border-neutral-300 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  {downloadingReceipt ? "Downloading..." : "Download Receipt"}
                </button>
              </>
            )}
            <Link
              to="/tenant/bills"
              className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">←</span>
              Back to bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cancelled state
  if (order.status === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4 py-12 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="w-full max-w-md rounded-xs border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            ✕
          </div>
          <h2 className="mt-4 text-xl font-semibold">Order Cancelled</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            This order was cancelled. Your bills have been released and are available to pay again.
          </p>
          <div className="mt-6">
            <Link
              to="/tenant/bills"
              className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">←</span>
              Back to bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  const isExpired =
    order.status === "failed" ||
    (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now());

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4 py-12 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED]">
        <div className="w-full max-w-md rounded-xs border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-400/10 dark:text-red-400">
            ⏰
          </div>
          <h2 className="mt-4 text-xl font-semibold">Order Expired</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            This order has expired. Your bills have been released and you can create a new payment order.
          </p>
          <div className="mt-6">
            <Link
              to="/tenant/bills"
              className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#edbb2e]"
            >
              <span aria-hidden="true">←</span>
              Back to bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active pending order: breakdown + Pay button
  return (
    <div className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-[#171717] transition-colors duration-300 dark:bg-[#101010] dark:text-[#F1F0ED] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tenant/bills"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back to bills
          </Link>
          <span className="rounded-xs bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
            Pending Payment
          </span>
        </div>

        <div className="overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#171717]">
          {/* Order Header */}
          <div className="border-b border-neutral-100 p-6 dark:border-neutral-800 sm:p-7">
            <h1 className="text-2xl font-semibold tracking-tight">
              Complete Payment
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Order ID: <span className="font-mono text-xs">{order._id}</span>
            </p>
            {order.property?.propertyName && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Property: {order.property.propertyName}
                {order.unit?.unitName && ` · Unit ${order.unit.unitName}`}
              </p>
            )}
          </div>

          {/* Bills Breakdown */}
          <div className="p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Bills included in this order ({order.items?.length || 0})
            </h2>

            <div className="mt-4 divide-y divide-neutral-100 border-y border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
              {order.items?.map((item, index) => {
                const bill = item.bill || {};
                return (
                  <div
                    key={bill._id || index}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {bill.billName || "Bill"}
                      </p>
                      <p className="mt-1 text-xs capitalize text-neutral-500 dark:text-neutral-400">
                        {bill.category || "Utility"}
                        {bill.month && bill.year && ` · ${formatPeriod(bill.month, bill.year)}`}
                        {bill.dueDate && ` · Due ${formatDate(bill.dueDate)}`}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatCurrency(item.amount || bill.amount)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Total and Checkout */}
            <div className="mt-6 flex flex-col justify-between gap-4 rounded-xs bg-[#faf9f6] p-6 dark:bg-[#1d1d1d] sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Total Payable Amount
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={paying}
                className="inline-flex items-center justify-center gap-2 rounded-xs bg-[#f9c83d] px-8 py-3.5 text-base font-semibold text-black transition hover:bg-[#edbb2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paying ? "Processing Payment..." : `Pay ${formatCurrency(order.totalAmount)}`}
                {!paying && <span aria-hidden="true">→</span>}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
              Payment is processed securely via Razorpay. Your bills will be marked as paid immediately upon confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantPayment;
