"use client";

import { useState } from "react";
import axios from "axios";
import { UploadCloud, File, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send to Laravel API
      const response = await axios.post("http://127.0.0.1:8000/api/process-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 pt-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Document Extractor
          </h1>
          <p className="text-gray-300 text-lg">
            Upload your PDF and let our Python microservice parse it via the Laravel API.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl space-y-8">
          <div className="border-2 border-dashed border-white/30 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors bg-white/5 relative group">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                <UploadCloud size={48} className="text-purple-300" />
              </div>
              <div>
                <p className="text-xl font-medium">
                  {file ? file.name : "Drag and drop your PDF here"}
                </p>
                <p className="text-gray-400 text-sm mt-2">or click to browse</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <File /> Extract Data
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl flex items-start gap-4 text-red-200">
            <AlertCircle className="shrink-0 text-red-400 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-red-400">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-black/50 border border-white/10 p-6 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              <CheckCircle2 className="text-green-400" />
              <h3 className="font-bold text-xl text-green-400">Extraction Successful</h3>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
