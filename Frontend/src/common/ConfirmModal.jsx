import React, { useEffect } from "react";
import { AlertTriangle, X, LoaderCircle } from "lucide-react";

export default function ConfirmModal({ isOpen, title = "Are you sure?", message, confirmText = "Confirm", cancelText = "Cancel", destructive = true, loading = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => { if (event.key === "Escape" && !loading) onCancel(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-message" className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-stone-700 dark:bg-[#1b1b1b]">
        <div className="mb-4 flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${destructive ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300"}`}><AlertTriangle size={23} /></div>
          <div className="min-w-0 flex-1"><h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><p id="confirm-modal-message" className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{message}</p></div>
          <button type="button" onClick={onCancel} disabled={loading} aria-label="Close confirmation" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-stone-800"><X size={19} /></button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-stone-700 dark:text-gray-200 dark:hover:bg-stone-800">{cancelText}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-yellow-400 text-black hover:bg-yellow-500"}`}>{loading && <LoaderCircle size={16} className="animate-spin" />}{loading ? "Please wait…" : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
