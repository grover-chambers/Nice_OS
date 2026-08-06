"use client";

import toast, { Toaster } from "react-hot-toast";

export const toaster = toast;

export function ToastViewport() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: { fontSize: 13, borderRadius: 10, padding: "8px 14px" },
      }}
    />
  );
}
