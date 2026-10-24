import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);
const toastStyles = {
  success: { icon: CheckCircle2, classes: "border-green-200 bg-white text-green-800 dark:border-green-900 dark:bg-[#1b1b1b] dark:text-green-300" },
  error: { icon: XCircle, classes: "border-red-200 bg-white text-red-800 dark:border-red-900 dark:bg-[#1b1b1b] dark:text-red-300" },
  warning: { icon: AlertTriangle, classes: "border-amber-200 bg-white text-amber-800 dark:border-amber-900 dark:bg-[#1b1b1b] dark:text-amber-300" },
  info: { icon: Info, classes: "border-blue-200 bg-white text-blue-800 dark:border-blue-900 dark:bg-[#1b1b1b] dark:text-blue-300" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    if (duration > 0) window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), duration);
    return id;
  }, []);
  const dismissToast = (id) => setToasts((items) => items.filter((item) => item.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const config = toastStyles[toast.type] || toastStyles.info;
          const Icon = config.icon;
          return (
            <div key={toast.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur ${config.classes}`}>
              <Icon size={21} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification" className="rounded p-0.5 opacity-70 hover:opacity-100"><X size={17} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
