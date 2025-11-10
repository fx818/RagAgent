"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  X,
} from "lucide-react";

interface FileItem {
  file: File;
  status: "idle" | "uploading" | "completed" | "error";
  progress?: number;
  response?: string;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";

  // 🧩 Select Files
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        status: "idle" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 🧩 Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      status: "idle" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  // 🧹 Clear all files
  const handleClearAll = () => setFiles([]);

  // 🚀 Upload Files (Real API)
  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const fileItem = updated[i];
      updated[i].status = "uploading";
      setFiles([...updated]);

      try {
        const formData = new FormData();
        formData.append("files", fileItem.file);

        // ✅ Send to backend
        const res = await fetch(`${BASE_URL}/api/qa/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload failed (${res.status})`);

        const data = await res.json();
        console.log("Upload Response:", data);

        updated[i].status = "completed";
        updated[i].progress = 100;
        updated[i].response = data.message || "Uploaded successfully ✅";
        setFiles([...updated]);
      } catch (err: any) {
        console.error("Upload Error:", err);
        updated[i].status = "error";
        updated[i].error = err.message || "Upload failed.";
        setFiles([...updated]);
      }
    }

    setUploading(false);
  };

  // 🗑️ Remove a file from list
  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 font-sans px-6 py-10">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Upload Documents
        </h1>

        {/* Upload Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-white flex flex-col items-center justify-center text-center hover:bg-blue-50 transition cursor-pointer"
        >
          <UploadCloud size={48} className="text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-1">
            Drag & Drop Files or Folders Here
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Supports PDF, DOCX, and TXT formats.
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.docx"
            onChange={handleFileSelect}
            id="fileInput"
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="px-5 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-md hover:bg-blue-100 hover:text-blue-700 transition font-medium"
          >
            Browse Files
          </label>
        </div>

        {/* Actions */}
        {files.length > 0 && (
          <div className="flex justify-between items-center mt-8 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Uploads</h2>
            <div className="flex gap-3">
              <button
                onClick={handleClearAll}
                className="text-gray-600 hover:text-red-600 text-sm font-medium"
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Uploading...
                  </>
                ) : (
                  "Start Upload"
                )}
              </button>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="space-y-3">
          {files.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                item.status === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200 hover:border-blue-200"
              } transition`}
            >
              {/* File Info */}
              <div className="flex items-center gap-3">
                <FileText
                  size={22}
                  className={`${
                    item.status === "error" ? "text-red-500" : "text-blue-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                {item.status === "uploading" && (
                  <div className="flex flex-col items-end">
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Uploading... {item.progress}%
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {item.status === "completed" && (
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-green-600 gap-1 text-sm font-medium">
                      <CheckCircle size={16} /> Completed
                    </div>
                    {item.response && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px] text-right">
                        {item.response}
                      </p>
                    )}
                  </div>
                )}

                {item.status === "error" && (
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-red-600 gap-1 text-sm font-medium">
                      <XCircle size={16} /> Error
                    </div>
                    {item.error && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px] text-right">
                        {item.error}
                      </p>
                    )}
                  </div>
                )}

                {item.status === "idle" && (
                  <p className="text-gray-400 text-sm">Pending</p>
                )}

                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
