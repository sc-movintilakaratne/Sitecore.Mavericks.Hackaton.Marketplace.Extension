"use client";

import React, { useState } from "react";

// -----------------------------------------------------------------------------
// 1. DEFINE YOUR BRANDS & IDs HERE
// -----------------------------------------------------------------------------
const BRAND_OPTIONS = [
  { name: "Essential Living", id: "48016" },
  { name: "Skywings", id: "48107" },
  { name: "Forma-lux", id: "48016" },
  { name: "Nova-Medical", id: "48017" },
];

interface ApiResponse {
  success: boolean;
  assetId?: string;
  imagePreview?: string;
  error?: string;
}

export default function ContentGenerationTab() {
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);

  // Notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "error";
  } | null>(null);

  const showToast = (message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form State
  const [brandName, setBrandName] = useState(BRAND_OPTIONS[0].name);
  const [selectedBrandId, setSelectedBrandId] = useState(BRAND_OPTIONS[0].id);
  const [description, setDescription] = useState("");

  //real handle generate function
  const handleGenerate = async () => {
    if (!description) return alert("Please enter a description");

    setLoading(true);
    setGeneratedImage(null);
    setAssetId(null);

    try {
      const res = await fetch("/api/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName, // We still send the Name to the AI for context
          productDescription: description,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.success) throw new Error(data.error || "Generation failed");

      setGeneratedImage(data.imagePreview!);
      setAssetId(data.assetId!);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // const handleGenerate = async () => {
  //   if (!description)
  //     return alert("Please enter a description (even for mock)");

  //   setLoading(true);
  //   setTimeout(() => {
  //     const mockImage =
  //       "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

  //     setGeneratedImage(mockImage);
  //     setAssetId("mock-asset-id-" + Date.now());
  //     setLoading(false);
  //   }, 1000);
  // };

  // ---------------------------------------------------------------------------
  // 2. THE UPLOAD FUNCTION
  // ---------------------------------------------------------------------------
  const handleUploadToContentHub = async () => {
    if (!generatedImage) return;

    setIsUploading(true);

    try {
      const response = await fetch("/api/upload-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: generatedImage,
          brandId: selectedBrandId,
          fileName: `ai-gen-${Date.now()}.png`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          `Upload Successful! Asset Created (ID: ${result.assetId})`,
          "info"
        );
      } else {
        throw new Error(result.error || "Unknown upload error");
      }
    } catch (error: any) {
      console.error("Upload failed", error);

      showToast(`Upload Failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setAssetId(null);
    setDescription("");
  };

  // ---------------------------------------------------------------------------
  // UPDATED DOWNLOAD FUNCTION (Iframe Compatible)
  // ---------------------------------------------------------------------------
  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `opticore-asset-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      showToast(
        "If download didn't start, Please Right-Click the image and select 'Save Image As'",
        "info"
      );
    } catch (error) {
      console.warn("Download blocked by iframe:", error);
      showToast(
        "Download blocked by security. Please Right-Click image -> 'Save Image As'",
        "error"
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Section */}
      <div className="px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-violet-100 text-violet-600 p-1.5 rounded-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </span>
          AI Asset Studio
        </h2>
      </div>

      {/* VIEW 1: SUCCESS STATE (Image Generated) */}
      {generatedImage ? (
        <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
          <div className="relative group w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
            {/* --- IMAGE AREA --- */}
            <div className="relative aspect-square md:aspect-[4/3] w-full">
              <img
                src={generatedImage}
                alt="AI Result"
                className="w-full h-full object-cover"
              />

              {/* --- TOP OVERLAY (Text & Close Button) --- */}
              <div className="absolute inset-x-0 top-0 p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex justify-between items-start">
                {/* Text Content */}
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 p-1.5 rounded-full text-green-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg tracking-tight">
                      Asset Ready
                    </h3>
                  </div>
                  <p className="text-sm text-gray-200 pl-9 opacity-90">
                    Tagged for{" "}
                    <strong className="text-white">{brandName}</strong> (ID:{" "}
                    {selectedBrandId})
                  </p>
                </div>

                {/* Discard Button */}
                <button
                  onClick={handleReset}
                  disabled={isUploading}
                  className="bg-white/10 hover:bg-red-400/50 backdrop-blur-md border border-white/10 text-white rounded-full p-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Discard & Reset"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* --- BOTTOM OVERLAY (AI Badge & Download) --- */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                {/* LEFT: AI Badge (Hover Only) */}
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded border border-white/10 cursor-default opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                  Generated by Opticore AI
                </span>

                {/* RIGHT: Action Buttons  */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* PREVIEW BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPreviewOpen(true);
                    }}
                    className="p-2 bg-black/40 hover:bg-black/70 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 transform hover:scale-110 shadow-sm"
                    title="Preview Full Image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  </button>

                  {/* DOWNLOAD BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="p-2 bg-black/40 hover:bg-black/70 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 transform hover:scale-110 shadow-sm"
                    title="Download Image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* --- ACTION BAR (Bottom) --- */}
            <div className="p-4 bg-white border-t border-gray-100">
              <button
                onClick={handleUploadToContentHub}
                disabled={isUploading}
                className={`w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.99]
          ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/25"
          }`}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading Asset...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload to Content Hub
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: INPUT FORM */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Step 1: Context */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">
                1. Brand Context
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                  value={selectedBrandId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedBrandId(newId);
                    const brand = BRAND_OPTIONS.find((b) => b.id === newId);
                    if (brand) setBrandName(brand.name);
                  }}
                  disabled={loading}
                >
                  {BRAND_OPTIONS.map((brand, index) => (
                    <option key={brand.id + index} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Step 2: Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">
                2. Product Vision
              </label>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px] resize-none"
                placeholder="Describe image you want to generate... "
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Loading Animation */}
            {loading && (
              <div className="text-center p-8 w-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                  <div className="absolute w-full h-full rounded-full bg-gradient-to-tr from-violet-200/40 to-blue-200/40 animate-pulse blur-xl"></div>
                  <div className="absolute w-20 h-20 border-2 border-indigo-100 rounded-full animate-[spin_4s_linear_infinite]"></div>
                  <div className="absolute w-20 h-20 border-t-[3px] border-l-[1px] border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/50 flex items-center justify-center animate-pulse">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                    AI Processing Initialized
                  </h3>
                  <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">
                    Opticore is dreaming up your image...
                  </p>
                </div>
              </div>
            )}
          </div>

          {!loading && (
            <button
              onClick={handleGenerate}
              disabled={!description}
              className={`relative w-9/10 mx-auto block py-3 px-4 mb-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ease-out transform overflow-hidden group
                ${
                  !description
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-[1.02] active:scale-[0.98] border border-indigo-500/30"
                }
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Asset
              </span>
            </button>
          )}
        </>
      )}

      {/* --- TOAST NOTIFICATION --- */}

      {toast && (
        <div className="absolute bottom-15 inset-x-4 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300 flex justify-center pointer-events-none">
          <div
            className={`pointer-events-auto max-w-xl w-full px-5 py-4 flex items-center justify-between rounded-xl shadow-2xl border ${
              toast.type === "error"
                ? "bg-red-100 border-red-300 text-red-900"
                : "bg-blue-100 border-green-300 text-green-900"
            } backdrop-blur-md`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "error" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 flex-shrink-0 text-red-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 flex-shrink-0 text-blue-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  />
                </svg>
              )}
              <span className="text-sm font-bold tracking-tight">
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => setToast(null)}
              className={`p-1.5 rounded-full transition-all active:scale-95 ${
                toast.type === "error"
                  ? "hover:bg-red-200 text-red-800"
                  : "hover:bg-blue-200 text-blue-800"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* --- FULL SCREEN PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 p-1 text-white/70 hover:text-white bg-white/10 hover:bg-red-400/50 rounded-lg  transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Large Image */}
          <img
            src={generatedImage!}
            alt="Full Preview"
            className="max-w-full max-h-full object-contain rounded shadow-2xl scale-in-95 animate-in duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
