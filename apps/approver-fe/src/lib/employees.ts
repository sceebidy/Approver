export interface PortalEmployee {

  id: string;

  employeeId: string;

  namaLengkap: string;

  jabatan?: string;

  gradeLevel?: number;

  gradeKode?: string;

  unitNama?: string;

  penempatanNama?: string;

  email?: string;

}



export interface SelectedEmployee {

  id: string;

  employeeId: string;

  namaLengkap: string;

  jabatan?: string;

  unitNama?: string;

  extractedText?: string;

}



const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;



function asRecord(value: unknown): Record<string, unknown> | null {

  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

}



function pickString(...values: unknown[]): string | undefined {

  for (const value of values) {

    if (typeof value === "string" && value.trim()) return value.trim();

  }

  return undefined;

}



function extractEmployeeList(raw: unknown): unknown[] {

  if (Array.isArray(raw)) return raw;



  const payload = asRecord(raw);

  if (!payload) return [];



  const data = payload.data;

  if (Array.isArray(data)) return data;



  const nested = asRecord(data);

  if (nested && Array.isArray(nested.data)) return nested.data;



  return [];

}



export function mapPortalEmployee(raw: unknown): PortalEmployee | null {

  const emp = asRecord(raw);

  if (!emp) return null;



  const grade = asRecord(emp.grade);

  const unit = asRecord(emp.unit);

  const penempatan = asRecord(emp.penempatanArea) ?? asRecord(emp.penempatan);



  const id = pickString(emp.id, emp.employeeId, emp.employee_id);

  const namaLengkap = pickString(emp.namaLengkap, emp.nama_lengkap, emp.name);

  if (!id || !namaLengkap) return null;



  return {

    id,

    employeeId: pickString(emp.employeeId, emp.employee_id, emp.id) ?? id,

    namaLengkap,

    jabatan: pickString(emp.jabatan, emp.role, emp.position),

    gradeLevel: typeof grade?.level === "number" ? grade.level : undefined,

    gradeKode: pickString(grade?.kode, grade?.nama, emp.gradeKode, emp.grade_kode),

    unitNama: pickString(unit?.nama, emp.unitNama, emp.unit_nama),

    penempatanNama: pickString(penempatan?.nama, emp.penempatanNama, emp.penempatan_nama),

    email: pickString(emp.email),

  };

}



export function isSelectedEmployee(value: unknown): value is SelectedEmployee {

  const obj = asRecord(value);

  if (!obj) return false;

  const hasId = "employeeId" in obj || "employee_id" in obj || "id" in obj;

  const hasName = "namaLengkap" in obj || "nama_lengkap" in obj || "name" in obj;

  return hasId && hasName;

}



export function getExtractedText(value: unknown): string {

  if (typeof value === "string") return value;

  if (isSelectedEmployee(value)) {

    return value.extractedText ?? value.namaLengkap;

  }

  return "";

}



export function normalizePortalEmployees(raw: unknown): PortalEmployee[] {

  return extractEmployeeList(raw)

    .map(mapPortalEmployee)

    .filter((emp): emp is PortalEmployee => emp !== null);

}



export function toSelectedEmployee(emp: PortalEmployee, extractedText?: string): SelectedEmployee {

  return {

    id: emp.id,

    employeeId: emp.employeeId,

    namaLengkap: emp.namaLengkap,

    jabatan: emp.jabatan,

    unitNama: emp.unitNama,

    extractedText,

  };

}



export function approverPayloadFromSelection(value: unknown): Record<string, string> | null {

  if (isSelectedEmployee(value)) {

    return {

      employee_id: value.employeeId,

      employeeId: value.employeeId,

      id: value.id,

      name: value.namaLengkap,

      namaLengkap: value.namaLengkap,

      role: value.jabatan ?? "",

      jabatan: value.jabatan ?? "",

    };

  }

  if (typeof value === "string" && UUID_RE.test(value)) {

    return { employee_id: value, employeeId: value };

  }

  return null;

}



export function isApproverFieldKey(key: string): boolean {
  if (key === "approval_roles") return false;
  const k = key.toLowerCase();
  return (
    k.includes("approv") ||
    k.includes("accept") ||
    k.includes("prepared") ||
    k.includes("checked") ||
    k.includes("issued") ||
    k.includes("requested") ||
    k.includes("received") ||
    k.includes("menyetujui") ||
    k.includes("disetujui") ||
    k.includes("diperiksa") ||
    k.endsWith("_oleh")
  );
}



export function formatApproverFieldLabel(key: string): string {

  return key

    .replace(/_/g, " ")

    .replace(/\b\w/g, (char) => char.toUpperCase());

}



export function collectApproversFromData(data: Record<string, unknown>): Record<string, string>[] {
  const approvers: Record<string, string>[] = [];
  const seen = new Set<string>();

  const add = (value: unknown, roleKey?: string) => {
    const payload = approverPayloadFromSelection(value);
    if (!payload) return;

    const empId = payload.employee_id ?? payload.employeeId ?? payload.id;
    const role = roleKey ? roleKey.toLowerCase() : (payload.role || "approver");

    // Kunci deduplikasi mengombinasikan empId + role agar 1 user dapat memegang multiple role berbeda
    const key = `${empId}:${role}`;
    if (!empId || seen.has(key)) return;

    seen.add(key);
    approvers.push({
      ...payload,
      role: role,
    });
  };

  const roles = data.approval_roles;
  if (roles && typeof roles === "object" && !Array.isArray(roles)) {
    for (const [roleKey, val] of Object.entries(roles as Record<string, unknown>)) {
      add(val, roleKey);
    }
  }

  for (const [key, val] of Object.entries(data)) {
    if (key === "approval_roles") continue;
    if (isApproverFieldKey(key)) add(val, key);
  }

  return approvers;
}



export function filterEmployees(employees: PortalEmployee[], query: string): PortalEmployee[] {

  const q = query.trim().toLowerCase();

  if (!q) return employees.slice(0, 50);

  return employees

    .filter((emp) => {

      const haystack = [emp.namaLengkap, emp.jabatan, emp.unitNama, emp.gradeKode, emp.penempatanNama, emp.email]

        .filter(Boolean)

        .join(" ")

        .toLowerCase();

      return haystack.includes(q);

    })

    .slice(0, 50);

}


