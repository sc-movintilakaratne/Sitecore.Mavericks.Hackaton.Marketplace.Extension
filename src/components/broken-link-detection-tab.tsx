import React, { useState, useMemo } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Image,
  Link2,
} from "lucide-react";
import { ClientSDK, PagesContext } from "@sitecore-marketplace-sdk/client";
import { secretApiToken } from "../utils/utilities/token";
import { getPageStructure } from "../api/sitecore/getPageStructure";
import { validateHtmlContent } from "../lib/check-broken-links";

interface AuditIssue {
  id: string;
  type: "image" | "anchor";
  tag: string;
  attribute: string;
  value: string;
  issue: string;
  severity: "critical" | "warning" | "info";
  lineContext: string;
  lineNumber?: number;
}

interface AuditResults {
  totalElements: number;
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
  issues: AuditIssue[];
  breakdown: {
    anchors: { total: number; issues: number };
    images: { total: number; issues: number };
  };
  scanTime: number;
}

export default function BrokenLinkDetectionTab({
  pageInfo,
  client,
}: {
  pageInfo?: PagesContext;
  client: ClientSDK | null;
}) {
  const [results, setResults] = useState<AuditResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "images" | "links">("all");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const auditContent = async () => {
    setIsAnalyzing(true);
    setError("");
    setResults(null);

    try {
      const pageData = await getPageStructure({
        token: secretApiToken,
        pageId: pageInfo?.pageInfo?.id || "",
      });

      console.log("pageInfo", pageInfo);

      const data: any = validateHtmlContent(pageData.html);

      setResults(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while auditing content"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (activeTab === "images")
      return results.issues.filter((r) => r.type === "image");
    if (activeTab === "links")
      return results.issues.filter((r) => r.type === "anchor");
    return results.issues;
  }, [results, activeTab]);

  const qualityScore = results
    ? Math.round(
        ((results.totalElements - results.totalIssues) /
          results.totalElements) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-rose-800">Error</h3>
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <div>
                <h3 className="font-semibold text-indigo-800">
                  Scanning in progress...
                </h3>
                <p className="text-sm text-indigo-600 mt-1">
                  Fetching HTML from Sitecore and analyzing content
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            <button
              onClick={auditContent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Search className="h-5 w-5" />
              Start Audit
            </button>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                  Total Issues
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {results.totalIssues}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                <div className="text-xs font-medium text-blue-500 mb-1 uppercase tracking-wider">
                  Info
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {results.info}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div className="text-xs font-medium text-amber-500 mb-1 uppercase tracking-wider">
                  Warnings
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {results.warning}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="text-xs font-medium text-indigo-500 mb-1 uppercase tracking-wider">
                  Quality Score
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {qualityScore}%
                </div>
              </div>
            </div>

            {/* Element Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Element Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Anchor Links
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.breakdown.anchors.total}
                  </div>
                  <div
                    className={`text-xs mt-1 font-semibold ${
                      results.breakdown.anchors.issues > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {results.breakdown.anchors.issues} issues
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Images
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.breakdown.images.total}
                  </div>
                  <div
                    className={`text-xs mt-1 font-semibold ${
                      results.breakdown.images.issues > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {results.breakdown.images.issues} issues
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 flex items-center bg-slate-50">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "all"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All Issues
                </button>
                <button
                  onClick={() => setActiveTab("images")}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "images"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Images (
                  {results.issues.filter((r) => r.type === "image").length})
                </button>
                <button
                  onClick={() => setActiveTab("links")}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "links"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Links (
                  {results.issues.filter((r) => r.type === "anchor").length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Type
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Issue
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Severity
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((result) => (
                        <tr
                          key={result.id}
                          className="group hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            {result.type === "image" ? (
                              <span className="flex items-center gap-2 text-slate-600 text-sm">
                                <Image className="h-4 w-4 text-slate-400" />
                                Img
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-slate-600 text-sm">
                                <Link2 className="h-4 w-4 text-slate-400" />
                                Link
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-slate-900">
                              {result.issue}
                            </div>
                            <div
                              className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]"
                              title={result.lineContext}
                            >
                              {result.lineContext}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {result.severity === "critical" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                Critical
                              </span>
                            )}
                            {result.severity === "warning" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Warning
                              </span>
                            )}
                            {result.severity === "info" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                Info
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-slate-500 italic max-w-xs truncate">
                              {result.attribute}: {result.value}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="h-10 w-10 text-slate-200" />
                            <span className="text-sm font-medium">
                              No issues detected
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !isAnalyzing && !error && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Ready to Audit Sitecore Content
            </h3>
            <p className="text-slate-600 mb-6">
              Click "Audit Content" to analyze your Sitecore HTML for broken
              links and missing attributes
            </p>
            <button
              onClick={auditContent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Search className="h-5 w-5" />
              Start Audit
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
