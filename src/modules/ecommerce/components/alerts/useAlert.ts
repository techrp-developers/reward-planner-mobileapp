import { useContext } from "react";
import { AlertContext } from "./AlertContext";

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  return {
    success: (title: string, message: string, duration = 3000) =>
      context.show({ type: "success", title, message, duration }),
    error: (title: string, message: string, duration = 4000) =>
      context.show({ type: "error", title, message, duration }),
    warning: (title: string, message: string, duration = 3500) =>
      context.show({ type: "warning", title, message, duration }),
    info: (title: string, message: string, duration = 3000) =>
      context.show({ type: "info", title, message, duration }),
    show: context.show,
    dismiss: context.dismiss,
    dismissAll: context.dismissAll,
  };
}
