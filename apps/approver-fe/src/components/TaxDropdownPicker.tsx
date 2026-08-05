"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Percent } from "lucide-react";

export interface TaxOption {
  id: number;
  name: string;
  value: number;
}

interface TaxDropdownPickerProps {
  taxes: TaxOption[];
  selectedTaxIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
}

export default function TaxDropdownPicker({
  taxes,
  selectedTaxIds,
  onChange,
  placeholder = "Pilih Jenis & Tarif Pajak...",
}: TaxDropdownPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTaxType = (name: string): "ppn" | "pph" => {
    return name.toLowerCase().includes("pph") ? "pph" : "ppn";
  };

  const filteredTaxes = taxes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.value).includes(searchQuery)
  );

  const toggleTax = (taxId: number) => {
    if (selectedTaxIds.includes(taxId)) {
      onChange(selectedTaxIds.filter((id) => id !== taxId));
    } else {
      onChange([...selectedTaxIds, taxId]);
    }
  };

  const removeTax = (e: React.MouseEvent, taxId: number) => {
    e.stopPropagation();
    onChange(selectedTaxIds.filter((id) => id !== taxId));
  };

  const selectedTaxes = taxes.filter((t) => selectedTaxIds.includes(t.id));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 bg-white border rounded-lg flex items-center justify-between gap-2 cursor-pointer transition select-none ${
          isOpen ? "border-[#1F3A5F] ring-1 ring-[#1F3A5F]" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 overflow-hidden">
          {selectedTaxes.length === 0 ? (
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Percent size={14} className="text-gray-400 shrink-0" />
              {placeholder}
            </span>
          ) : (
            selectedTaxes.map((t) => {
              const isPph = getTaxType(t.name) === "pph";
              return (
                <span
                  key={t.id}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    isPph
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}
                >
                  <span>
                    {t.name} ({Number(t.value)}%)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => removeTax(e, t.id)}
                    className="hover:opacity-75 p-0.5 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#1F3A5F]" : ""
          }`}
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
          {/* Searchbar inside dropdown */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Cari jenis atau tarif pajak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:outline-hidden focus:border-[#1F3A5F] focus:ring-1 focus:ring-[#1F3A5F]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 p-1">
            {filteredTaxes.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                Pajak tidak ditemukan.
              </div>
            ) : (
              filteredTaxes.map((tax) => {
                const isSelected = selectedTaxIds.includes(tax.id);
                const isPph = getTaxType(tax.name) === "pph";
                return (
                  <div
                    key={tax.id}
                    onClick={() => toggleTax(tax.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition select-none ${
                      isSelected
                        ? "bg-blue-50/70 text-[#1F3A5F] font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isSelected
                            ? "bg-[#1F3A5F] border-[#1F3A5F] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs">{tax.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isPph
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {isPph ? "-" : "+"}{Number(tax.value)}%
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer inside dropdown */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>{selectedTaxIds.length} pajak dipilih</span>
            {selectedTaxIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-red-600 font-semibold hover:underline cursor-pointer"
              >
                Reset Pilihan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
