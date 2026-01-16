import { ClientSDK, PagesContext } from "@sitecore-marketplace-sdk/client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Zap,
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { getPageStructure } from "../api/sitecore/getPageStructure";
import { getSeoScore, SeoScoreResponse } from "../api/seo/getSeoScore";
import { fakeToken } from "../utils/utilities/token";

interface SeoMetric {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  message: string;
  status: "PASS" | "WARNING" | "FAIL";
}

const SeoMetricCard: React.FC<{ metric: SeoMetric }> = ({ metric }) => {
  const getStatusColor = () => {
    switch (metric.status) {
      case "PASS":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "WARNING":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "FAIL":
        return "bg-rose-50 border-rose-200 text-rose-800";
    }
  };

  const getStatusIcon = () => {
    switch (metric.status) {
      case "PASS":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "FAIL":
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (metric.status) {
      case "PASS":
        return "bg-emerald-100 text-emerald-700";
      case "WARNING":
        return "bg-amber-100 text-amber-700";
      case "FAIL":
        return "bg-rose-100 text-rose-700";
    }
  };

  const percentage = Math.round((metric.score / metric.maxScore) * 100);

  return (
    <div className={`rounded-2xl border-2 p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <h4 className="font-bold text-base">{metric.label}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">
            {metric.score}/{metric.maxScore}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge()}`}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-sm mb-4 opacity-90">{metric.message}</p>
      <div className="w-full bg-white/60 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            metric.status === "PASS"
              ? "bg-emerald-500"
              : metric.status === "WARNING"
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export function SeoAnalysisTab({
  pageInfo,
  client,
}: {
  pageInfo?: PagesContext;
  client: ClientSDK | null;
}) {
  const [loading, setLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<SeoScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log(pageInfo?.pageInfo?.id);

  const handleSeoAnalysis = async () => {
    if (!pageInfo?.pageInfo?.id) {
      setError("No page selected");
      return;
    }

    setLoading(true);
    setError(null);
    setSeoResult(null);

    try {
      // Get page HTML content from Sitecore
      const pageData = await getPageStructure({
        token: fakeToken,
        pageId: pageInfo?.pageInfo?.id,
      });

      // console.log(pageData);

      if (!pageData?.html) {
        throw new Error("Failed to retrieve page HTML content");
      }

      // Analyze SEO using the HTML content
      const seoScore = await getSeoScore({
        html: pageData.html,
        url: pageInfo.pageInfo.path,
      });

      setSeoResult(seoScore);
    } catch (err) {
      console.error("Error analyzing SEO:", err);
      setError(
        `Failed to analyze SEO: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert SEO details to metrics with status
  const getMetrics = (): SeoMetric[] => {
    if (!seoResult?.details) return [];

    const details = seoResult.details;
    const metrics: SeoMetric[] = [];

    const metricConfigs = [
      { key: "title", label: "Title Tag", maxScore: 15 },
      { key: "metaDescription", label: "Meta Description", maxScore: 15 },
      { key: "headings", label: "Headings", maxScore: 20 },
      { key: "images", label: "Images", maxScore: 15 },
      { key: "links", label: "Links", maxScore: 10 },
      { key: "content", label: "Content", maxScore: 15 },
    ];

    metricConfigs.forEach((config) => {
      const detail = details[config.key as keyof typeof details];
      if (detail) {
        const percentage = (detail.score / config.maxScore) * 100;
        let status: "PASS" | "WARNING" | "FAIL";
        if (percentage >= 80) {
          status = "PASS";
        } else if (percentage >= 50) {
          status = "WARNING";
        } else {
          status = "FAIL";
        }

        metrics.push({
          key: config.key,
          label: config.label,
          score: detail.score,
          maxScore: config.maxScore,
          message: detail.message || "",
          status,
        });
      }
    });

    return metrics;
  };

  const metrics = getMetrics();
  const chartData = metrics.map((metric) => ({
    name: metric.label,
    value: Math.round((metric.score / metric.maxScore) * 100),
  }));

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto p-8">
        <div className="space-y-8">
          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSeoAnalysis}
              disabled={loading || !pageInfo?.pageInfo?.id}
              className={`px-6 py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                loading || !pageInfo?.pageInfo?.id
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing SEO...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Run SEO Analysis
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {!seoResult && !loading && !error && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center group">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Search className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                SEO Analysis Ready
              </h3>
              <p className="max-w-md text-slate-500">
                Click the button above to analyze the current page's SEO
                performance. The analysis will fetch the live HTML content from
                Sitecore and evaluate SEO best practices.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-800">Error</h3>
              </div>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800 mb-2">
                Analyzing SEO
              </p>
              <p className="text-slate-400 text-sm animate-pulse">
                Fetching page content and evaluating SEO metrics...
              </p>
            </div>
          )}

          {seoResult && !loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Score Widget */}
                <div className="md:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CheckCircle className="w-24 h-24" />
                  </div>
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="transparent"
                        stroke={getScoreColor(seoResult.score)}
                        strokeWidth="12"
                        strokeDasharray={351.8}
                        strokeDashoffset={
                          351.8 - (351.8 * seoResult.score) / 100
                        }
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter">
                        {seoResult.score}%
                      </span>
                      {seoResult.grade && (
                        <div className="text-lg font-bold text-slate-600 mt-1">
                          Grade: {seoResult.grade}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    SEO Score
                  </p>
                </div>

                {/* Metrics Bar Chart */}
                <div className="md:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.2em]">
                    Metrics Breakdown
                  </h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{
                            fontSize: 9,
                            fontWeight: 800,
                            fill: "#64748b",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                            fontWeight: "bold",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 10, 10, 0]}
                          barSize={20}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              {seoResult.recommendations && seoResult.recommendations.length > 0 && (
                <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">
                      SEO Recommendations
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {seoResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-base font-medium leading-relaxed flex items-start gap-2">
                        <span className="text-indigo-200 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics Cards */}
              {metrics.length > 0 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      SEO Metrics
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {metrics.filter((m) => m.status === "FAIL").length}{" "}
                        Critical
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {metrics.filter((m) => m.status === "WARNING").length}{" "}
                        Warnings
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {metrics.filter((m) => m.status === "PASS").length}{" "}
                        Passed
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {metrics.map((metric) => (
                      <SeoMetricCard key={metric.key} metric={metric} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
