"use client";

import { useEffect, useState } from "react";

type AnyObj = { [k: string]: any };

function Badge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium ${connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {connected ? "Terhubung ke SSO" : "Belum terhubung"}
    </span>
  );
}

function RenderValue({ value, depth = 0 }: { value: any; depth?: number }) {
  const indent = `ml-${Math.min(depth * 4, 12)}`;
  if (value === null || value === undefined) return <div className={`text-sm text-[#374151] ${indent}`}>-</div>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <div className={`text-sm text-[#374151] ${indent}`}>[]</div>;
    return (
      <div className={`space-y-2 ${indent}`}>
        {value.map((v, i) => (
          <div key={i} className="pl-3 border-l border-[#E5E7EB]">
            {typeof v === "object" ? <RenderObject obj={v} depth={depth + 1} /> : <div className="text-sm text-[#374151]">{String(v)}</div>}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return <RenderObject obj={value} depth={depth + 1} />;
  }
  return <div className={`text-sm text-[#111827] ${indent}`}>{String(value)}</div>;
}

function RenderObject({ obj, depth = 0 }: { obj: AnyObj; depth?: number }) {
  return (
    <div className={`space-y-1 text-sm`}> 
      {Object.keys(obj).map((k) => (
        <div key={k} className="flex gap-3 items-start">
          <div className="w-36 text-[13px] text-[#6B7280]">{k}</div>
          <div className="flex-1">
            <RenderValue value={obj[k]} depth={depth} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AnyObj | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setUser(null);

    fetch('/api/user', { credentials: 'include' })
      .then(async (res) => {
        if (!mounted) return;
        if (res.status === 401) {
          setConnected(false);
          setError('401 Unauthorized — belum ada session/token SSO yang valid.');
          return;
        }
        if (!res.ok) {
          const body = await res.text();
          setConnected(false);
          setError(`HTTP ${res.status}: ${body || res.statusText}`);
          return;
        }
        const data = await res.json();
        setConnected(true);
        setUser(data);
      })
      .catch((e) => {
        if (!mounted) return;
        setConnected(false);
        setError(String(e));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[15px] font-semibold text-[#111827]">Profile</h1>
          <p className="text-[12px] text-[#9CA3AF]">Cek koneksi akun Anda ke sistem SSO</p>
        </div>
        <div>
          <Badge connected={connected && !loading} />
        </div>
      </div>

      <div className="bg-white rounded-md border border-[#E3E6EA] p-4">
        {loading ? (
          <div className="text-sm text-[#6B7280]">Memuat status SSO...</div>
        ) : (
          <>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            {user ? (
              <div className="mt-3 space-y-3">
                <RenderObject obj={user} />
              </div>
            ) : (
              !error && <div className="text-sm text-[#6B7280]">Belum ada data pengguna.</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
