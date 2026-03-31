"use client";

import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  txHash?: string;
  duration?: number;
}

let toastIdCounter = 0;

type ToastListener = (toasts: Toast[]) => void;
const listeners = new Set<ToastListener>();
let globalToasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((l) => l([...globalToasts]));
}

function dismissToast(id: string) {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  notifyListeners();
}

function showToast(options: Omit<Toast, "id">): string {
  const id = `toast-${++toastIdCounter}`;
  const duration = options.duration ?? 5000;
  const newToast: Toast = { ...options, id, duration };
  globalToasts = [...globalToasts, newToast];
  notifyListeners();
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export const toast = {
  show: showToast,
  dismiss: dismissToast,
  success(message: string, txHash?: string) {
    return showToast({ type: "success", message, txHash });
  },
  error(message: string) {
    return showToast({ type: "error", message });
  },
  warning(message: string) {
    return showToast({ type: "warning", message });
  },
  info(message: string) {
    return showToast({ type: "info", message });
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([...globalToasts]);

  useEffect(() => {
    const listener: ToastListener = (updated) => setToasts(updated);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => dismissToast(id), []);

  return { toasts, dismiss };
}
