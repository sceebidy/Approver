/**
 * Date Utilities for Date Range Filtering
 * Reproducible, timezone-safe, and easily readable date functions.
 */

export type DatePreset = "today" | "last_7_days" | "last_30_days" | "this_month";

/**
 * Convert a Date object to YYYY-MM-DD string format (Local Timezone).
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date input falls within [startDateStr, endDateStr] (inclusive).
 * Supports ISO strings, Date objects, or YYYY-MM-DD strings.
 */
export function isDateInRange(
  dateInput: string | Date | null | undefined,
  startDateStr: string,
  endDateStr: string
): boolean {
  if (!dateInput) return false;
  if (!startDateStr && !endDateStr) return true;

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;

    // Normalizing item date to timestamp (start of day local time)
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (startDateStr) {
      const [sY, sM, sD] = startDateStr.split("-").map(Number);
      if (sY && sM && sD) {
        const startTime = new Date(sY, sM - 1, sD).getTime();
        if (itemDate < startTime) return false;
      }
    }

    if (endDateStr) {
      const [eY, eM, eD] = endDateStr.split("-").map(Number);
      if (eY && eM && eD) {
        const endTime = new Date(eY, eM - 1, eD).getTime();
        if (itemDate > endTime) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate preset start and end dates in YYYY-MM-DD format.
 */
export function getDatePreset(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = formatDateToYYYYMMDD(now);

  switch (preset) {
    case "today":
      return { startDate: todayStr, endDate: todayStr };

    case "last_7_days": {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      return { startDate: formatDateToYYYYMMDD(past), endDate: todayStr };
    }

    case "last_30_days": {
      const past = new Date(now);
      past.setDate(now.getDate() - 29);
      return { startDate: formatDateToYYYYMMDD(past), endDate: todayStr };
    }

    case "this_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDateToYYYYMMDD(startOfMonth), endDate: todayStr };
    }

    default:
      return { startDate: "", endDate: "" };
  }
}

/**
 * Format date range into readable Indonesian string (e.g. "01 Jul - 15 Jul 2026").
 */
export function formatDateRangeLabel(startDateStr: string, endDateStr: string): string {
  if (!startDateStr && !endDateStr) return "Semua Tanggal";

  const formatSingle = (str: string) => {
    const [y, m, d] = str.split("-").map(Number);
    if (!y || !m || !d) return str;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatShort = (str: string) => {
    const [y, m, d] = str.split("-").map(Number);
    if (!y || !m || !d) return str;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  if (startDateStr && endDateStr) {
    if (startDateStr === endDateStr) {
      return formatSingle(startDateStr);
    }
    const [sY] = startDateStr.split("-");
    const [eY] = endDateStr.split("-");
    if (sY === eY) {
      return `${formatShort(startDateStr)} - ${formatSingle(endDateStr)}`;
    }
    return `${formatSingle(startDateStr)} - ${formatSingle(endDateStr)}`;
  }

  if (startDateStr) {
    return `Sejak ${formatSingle(startDateStr)}`;
  }

  return `Sampai ${formatSingle(endDateStr)}`;
}
