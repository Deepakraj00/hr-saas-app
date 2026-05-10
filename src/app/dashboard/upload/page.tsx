"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    created?: number;
    skipped?: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (
      dropped &&
      (dropped.name.endsWith(".xlsx") ||
        dropped.name.endsWith(".xls") ||
        dropped.name.endsWith(".csv"))
    ) {
      setFile(dropped);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (role) {
        formData.append("role", role);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message, created: data.created, skipped: data.skipped });
        setFile(null);
      } else {
        setResult({ success: false, message: data.error || "Upload failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Upload Candidates
        </h1>
        <p className="text-white/40 mt-1">
          Import candidates from Internshala Excel sheets
        </p>
      </div>

      <Card className="border-white/5 bg-white/[0.02] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Excel File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Input */}
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium">Role (Optional)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Web Developer, Video Editor..."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <p className="text-white/30 text-xs">If provided, all candidates in this file will be assigned this role.</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              dragging
                ? "border-indigo-500 bg-indigo-500/5"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  dragging
                    ? "bg-indigo-500/20 text-indigo-400 scale-110"
                    : "bg-white/5 text-white/30"
                }`}
              >
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/70 font-medium">
                  {dragging
                    ? "Drop your file here"
                    : "Drag & drop your Excel file here"}
                </p>
                <p className="text-white/30 text-sm mt-1">
                  or click to browse — .xlsx, .xls, .csv supported
                </p>
              </div>
            </div>
          </div>

          {/* Selected file */}
          {file && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-white/30">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-white/30 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-30"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Import
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                result.success
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    result.success ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {result.message}
                </p>
                {result.success && result.created !== undefined && (
                  <p className="text-xs text-white/30 mt-1">
                    {result.created} imported · {result.skipped} skipped
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 font-medium mb-2">
              Expected columns from Internshala:
            </p>
            <div className="flex flex-wrap gap-2">
              {["Student name", "Email", "Phone", "Mobile"].map((col) => (
                <span
                  key={col}
                  className="px-2 py-1 rounded-md bg-white/5 text-white/30 text-xs font-mono"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
