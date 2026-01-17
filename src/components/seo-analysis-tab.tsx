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
  FileText,
} from "lucide-react";
import { getPageStructure } from "../api/sitecore/getPageStructure";
import { analyzeHeadSeo, HeadSeoScoreResponse } from "../api/seo/getHeadSeoScore";
import { secretApiToken } from "../utils/utilities/token";
import { GoogleGenAI } from "@google/genai";

interface SeoMetric {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  message: string;
  status: "PASS" | "WARNING" | "FAIL";
}

interface SeoMetricCardProps {
  metric: SeoMetric;
  fieldValue: string;
  onFieldChange: (value: string) => void;
  onSuggest: () => void;
  isSuggesting: boolean;
  aiSuggestion?: string;
}

const SeoMetricCard: React.FC<SeoMetricCardProps> = ({
  metric,
  fieldValue,
  onFieldChange,
  onSuggest,
  isSuggesting,
  aiSuggestion,
}) => {
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
      <div className="w-full bg-white/60 rounded-full h-2 mb-4">
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

      {/* Text Field and Suggest Button for WARNING/FAIL metrics */}
      {(metric.status === "WARNING" || metric.status === "FAIL") && (
        <div className="space-y-3 mt-4 pt-4 border-t border-white/40">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              {metric.label}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => onFieldChange(e.target.value)}
                placeholder={`Enter ${metric.label.toLowerCase()}...`}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
              <button
                onClick={onSuggest}
                disabled={isSuggesting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                {isSuggesting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Suggest
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Generated Suggestion Display */}
          {aiSuggestion && (
            <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  AI Suggestion
                </p>
              </div>
              <p className="text-sm text-indigo-900 font-medium">{aiSuggestion}</p>
            </div>
          )}
        </div>
      )}
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
  const [seoResult, setSeoResult] = useState<HeadSeoScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [suggestingFields, setSuggestingFields] = useState<Record<string, boolean>>({});

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
        token: secretApiToken,
        pageId: pageInfo?.pageInfo?.id,
      });

      // console.log(pageData);

      if (!pageData?.html) {
        throw new Error("Failed to retrieve page HTML content");
      }

      // Analyze Head SEO using the HTML content
      const headSeoScore = analyzeHeadSeo(pageData.html);

      setSeoResult(headSeoScore);
    } catch (err) {
      console.error("Error analyzing SEO:", err);
      setError(
        `Failed to analyze SEO: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert Head SEO results to metrics with status
  const getMetrics = (): SeoMetric[] => {
    if (!seoResult) return [];

    const metrics: SeoMetric[] = [];

    const metricConfigs = [
      { key: "title", label: "Title Tag", maxScore: 100 },
      { key: "metaDescription", label: "Meta Description", maxScore: 100 },
      { key: "metaKeywords", label: "Meta Keywords", maxScore: 100 },
      { key: "ogTitle", label: "OG Title", maxScore: 100 },
      { key: "ogDescription", label: "OG Description", maxScore: 100 },
      { key: "ogImage", label: "OG Image", maxScore: 100 },
      { key: "ogUrl", label: "OG URL", maxScore: 100 },
    ];

    metricConfigs.forEach((config) => {
      const element = seoResult[config.key as keyof HeadSeoScoreResponse];
      if (element) {
        const percentage = element.score;
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
          score: element.score,
          maxScore: config.maxScore,
          message: element.message || "",
          status,
        });
      }
    });

    return metrics;
  };

  // Calculate overall score from head SEO elements
  const calculateOverallScore = (): number => {
    if (!seoResult) return 0;
    
    const scores = [
      seoResult.title.score,
      seoResult.metaDescription.score,
      seoResult.metaKeywords.score,
      seoResult.ogTitle.score,
      seoResult.ogDescription.score,
      seoResult.ogImage.score,
      seoResult.ogUrl.score,
    ];
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Generate recommendations based on head SEO results
  const getRecommendations = (): string[] => {
    if (!seoResult) return [];
    
    const recommendations: string[] = [];
    
    if (seoResult.title.score < 100) {
      recommendations.push(seoResult.title.message);
    }
    if (seoResult.metaDescription.score < 100) {
      recommendations.push(seoResult.metaDescription.message);
    }
    if (seoResult.metaKeywords.score < 100) {
      recommendations.push(seoResult.metaKeywords.message);
    }
    if (seoResult.ogTitle.score < 100) {
      recommendations.push(seoResult.ogTitle.message);
    }
    if (seoResult.ogDescription.score < 100) {
      recommendations.push(seoResult.ogDescription.message);
    }
    if (seoResult.ogImage.score < 100) {
      recommendations.push(seoResult.ogImage.message);
    }
    if (seoResult.ogUrl.score < 100) {
      recommendations.push(seoResult.ogUrl.message);
    }
    
    return recommendations;
  };

  // Function to call Google AI for SEO suggestions
  const callExternalAI = async (
    fieldKey: string,
    fieldLabel: string,
    currentValue: string,
    message: string
  ): Promise<string> => {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
      });

      // Build context-aware prompt based on field type
      let prompt = `You are an SEO expert. Generate an optimized ${fieldLabel} for a webpage.

Current Issue: ${message}
${currentValue ? `Current Value: ${currentValue}` : "No current value exists"}

Field Type: ${fieldKey}
Field Label: ${fieldLabel}

Requirements:`;

      // Add specific requirements based on field type
      switch (fieldKey) {
        case "title":
          prompt += `
- Must be 50-60 characters long
- Include primary keyword naturally
- Be compelling and click-worthy
- Accurately describe the page content`;
          break;
        case "metaDescription":
          prompt += `
- Must be 150-160 characters long
- Include primary keyword and call-to-action
- Be compelling and encourage clicks
- Summarize the page content accurately`;
          break;
        case "metaKeywords":
          prompt += `
- Provide 5-10 relevant keywords separated by commas
- Include primary and secondary keywords
- Use natural keyword variations`;
          break;
        case "ogTitle":
          prompt += `
- Must be 60 characters or less
- Optimized for social media sharing
- Engaging and shareable`;
          break;
        case "ogDescription":
          prompt += `
- Must be 200 characters or less
- Compelling social media preview text
- Encourages engagement and sharing`;
          break;
        case "ogImage":
          prompt += `
- Provide a relevant image URL or description
- Image should be 1200x630 pixels (recommended)
- Should represent the page content visually`;
          break;
        case "ogUrl":
          prompt += `
- Provide the canonical URL for this page
- Should be the full absolute URL
- Must be the primary URL for this content`;
          break;
        default:
          prompt += `
- Optimize for SEO best practices
- Be relevant and accurate`;
      }

      prompt += `

Generate only the optimized ${fieldLabel} value. Do not include explanations or additional text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      });

      const suggestion = response.text?.trim() || "";
      
      if (!suggestion) {
        throw new Error("AI did not generate a suggestion");
      }

      return suggestion;
    } catch (error) {
      console.error("Error calling Google AI:", error);
      // Fallback to a basic suggestion if AI fails
      return `Optimized ${fieldLabel} based on SEO best practices. ${message}`;
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSuggest = async (fieldKey: string, fieldLabel: string, message: string) => {
    setSuggestingFields((prev) => ({
      ...prev,
      [fieldKey]: true,
    }));

    try {
      const currentValue = fieldValues[fieldKey] || "";
      const suggestion = await callExternalAI(fieldKey, fieldLabel, currentValue, message);
      
      setAiSuggestions((prev) => ({
        ...prev,
        [fieldKey]: suggestion,
      }));
    } catch (err) {
      console.error("Error generating AI suggestion:", err);
      setError(`Failed to generate suggestion: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSuggestingFields((prev) => {
        const newState = { ...prev };
        delete newState[fieldKey];
        return newState;
      });
    }
  };

  const metrics = getMetrics();
  const overallScore = calculateOverallScore();
  const recommendations = getRecommendations();
  const chartData = metrics.map((metric) => ({
    name: metric.label,
    value: metric.score,
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
              {/* Page Details Section */}
              {pageInfo?.pageInfo && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Page Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Page Name
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {pageInfo.pageInfo.name || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Page ID
                      </p>
                      <p className="text-sm font-mono text-slate-600 break-all">
                        {pageInfo.pageInfo.id || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Path
                      </p>
                      <p className="text-sm font-medium text-slate-700 break-all">
                        {pageInfo.pageInfo.path || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Language
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {pageInfo.pageInfo.language || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                        stroke={getScoreColor(overallScore)}
                        strokeWidth="12"
                        strokeDasharray={351.8}
                        strokeDashoffset={
                          351.8 - (351.8 * overallScore) / 100
                        }
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter">
                        {overallScore}%
                      </span>
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
              {recommendations.length > 0 && (
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
                    {recommendations.map((rec, idx) => (
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
                      <SeoMetricCard
                        key={metric.key}
                        metric={metric}
                        fieldValue={fieldValues[metric.key] || ""}
                        onFieldChange={(value) => handleFieldChange(metric.key, value)}
                        onSuggest={() => handleSuggest(metric.key, metric.label, metric.message)}
                        isSuggesting={suggestingFields[metric.key] || false}
                        aiSuggestion={aiSuggestions[metric.key]}
                      />
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
