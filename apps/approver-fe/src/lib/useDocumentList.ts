"use client";

import { useState, useEffect, useCallback } from "react";
import { getXsrfToken } from "./csrf";

/**
 * Hook generik untuk fetch daftar dokumen dari backend Laravel Sanctum.
 * Menangani loading state, error, dan refresh setelah save.
 *
 * @param endpoint  Nama endpoint relatif terhadap NEXT_PUBLIC_API_URL, misal "ppab"
 */
export function useDocumentList<T = any>(endpoint: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

      const res = await fetch(`${apiUrl}/${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // GET request ke Sanctum stateful tidak memerlukan XSRF header,
          // tapi kita tetap sertakan jika cookie sudah ada (tidak mengganggu)
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          msg = j.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      // Backend mengembalikan { success: true, data: [...] }
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  useEffect(() => {
    const handleRefresh = () => {
      fetch_();
    };
    window.addEventListener("refresh-document-list", handleRefresh);
    return () => {
      window.removeEventListener("refresh-document-list", handleRefresh);
    };
  }, [fetch_]);

  return { rows, loading, error, refresh: fetch_ };
}
