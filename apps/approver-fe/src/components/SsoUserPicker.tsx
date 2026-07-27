"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, User, X } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import {
  filterEmployees,
  getExtractedText,
  isSelectedEmployee,
  normalizePortalEmployees,
  toSelectedEmployee,
  type PortalEmployee,
  type SelectedEmployee,
} from "@/lib/employees";

interface SsoUserPickerProps {
  value: unknown;
  onChange: (value: SelectedEmployee | string) => void;
  placeholder?: string;
}

export default function SsoUserPicker({ value, onChange, placeholder }: SsoUserPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<PortalEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const extractedText = getExtractedText(value);
  const selected = isSelectedEmployee(value) ? value : null;

  const fetchEmployees = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const trimmed = search.trim();
      if (trimmed) {
        params.set("search", trimmed);
        params.set("q", trimmed);
      }

      const url = `${getApiBaseUrl()}/portal/employees${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Sesi habis. Silakan login ulang."
            : `Gagal memuat data SSO (${res.status})`,
        );
      }

      const data = await res.json();
      setEmployees(normalizePortalEmployees(data));
    } catch (err) {
      setEmployees([]);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const focusTimer = setTimeout(() => searchRef.current?.focus(), 50);
    const fetchTimer = setTimeout(() => {
      fetchEmployees(query);
    }, query ? 300 : 0);

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(fetchTimer);
    };
  }, [open, query, fetchEmployees]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filtered = filterEmployees(employees, query);

  const handleSelect = (emp: PortalEmployee) => {
    onChange(toSelectedEmployee(emp, extractedText || undefined));
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(extractedText || "");
  };

  const displayLabel = selected
    ? `${selected.namaLengkap}${selected.jabatan ? ` — ${selected.jabatan}` : ""}`
    : extractedText || placeholder || "Cari dan pilih user (SSO)";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-[#E3E6EA] bg-white px-2.5 py-1.5 text-left text-sm hover:border-[#1F3A5F]/40"
      >
        <User size={14} className="shrink-0 text-[#9CA3AF]" />
        <span className={`flex-1 truncate ${selected ? "text-[#111827]" : "text-[#6B7280]"}`}>{displayLabel}</span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
            className="shrink-0 rounded p-0.5 text-[#9CA3AF] hover:bg-[#F1F3F6] hover:text-[#111827]"
            aria-label="Hapus pilihan"
          >
            <X size={14} />
          </span>
        ) : null}
        <ChevronDown size={14} className={`shrink-0 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {extractedText && !selected ? (
        <p className="mt-1 text-[11px] text-[#9CA3AF]">Dari dokumen: {extractedText}</p>
      ) : null}

      {open ? (
        <div className="absolute z-20 mt-1 w-full min-w-[280px] rounded-md border border-[#E3E6EA] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#E3E6EA] px-2.5 py-2">
            <Search size={14} className="text-[#9CA3AF]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, jabatan, atau unit..."
              className="w-full text-sm outline-none placeholder:text-[#9CA3AF]"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-4 text-center text-sm text-[#6B7280]">Memuat data karyawan...</p>
            ) : error ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchEmployees(query)}
                  className="mt-2 text-xs text-[#1F3A5F] underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[#6B7280]">
                {query ? "Tidak ada user yang cocok." : "Tidak ada data karyawan dari SSO."}
              </p>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-[#F8F9FB]"
                >
                  <span className="text-sm font-medium text-[#111827]">{emp.namaLengkap}</span>
                  <span className="text-[11px] text-[#6B7280]">
                    {[emp.jabatan, emp.unitNama, emp.gradeKode].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
