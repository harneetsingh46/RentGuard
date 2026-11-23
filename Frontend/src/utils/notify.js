import React from "react";
import toast from "react-hot-toast";
import { Info } from "lucide-react";

export function formatNotificationMessage(msg) {
  if (!msg || typeof msg !== "string") return msg || "";
  let text = msg.trim();
  if (!text) return "";
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (text.endsWith("!")) {
    text = text.slice(0, -1) + ".";
  } else if (!text.endsWith(".")) {
    text += ".";
  }
  return text;
}

export const notify = {
  success: (message, options) => {
    return toast.success(formatNotificationMessage(message), {
      duration: 3500,
      ...options,
    });
  },
  error: (message, options) => {
    return toast.error(formatNotificationMessage(message), {
      duration: 3500,
      ...options,
    });
  },
  info: (message, options) => {
    return toast(formatNotificationMessage(message), {
      duration: 3500,
      icon: React.createElement(Info, { size: 18, className: "text-blue-500 shrink-0" }),
      ...options,
    });
  },
  dismiss: (id) => toast.dismiss(id),
};

export default notify;
