import React, { useState } from "react";
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
  Shield,
  Sliders,
  Zap,
  Sparkles,
  Circle,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { getPageStructure } from "../api/sitecore/getPageStructure";
import { secretApiToken } from "../utils/utilities/token";
import {
  analyzeBrandCompliance,
  BrandGuidelines,
} from "../lib/brand-governance";
import { ClientSDK, PagesContext } from "@sitecore-marketplace-sdk/client";

interface Issue {
  category: string;
  description: string;
  status: "PASS" | "WARNING" | "FAIL";
  recommendation: string;
}

interface BrandAuditResult {
  overallScore: number;
  visualMetrics: {
    narrativeAlignment: number;
    structuralIntegrity: number;
    tonalConsistency: number;
  };
  summary: string;
  issues: Issue[];
}

const ComplianceCard: React.FC<{ issue: Issue }> = ({ issue }) => {
  const getStatusColor = () => {
    switch (issue.status) {
      case "PASS":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "WARNING":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "FAIL":
        return "bg-rose-50 border-rose-200 text-rose-800";
    }
  };

  const getStatusIcon = () => {
    switch (issue.status) {
      case "PASS":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "FAIL":
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (issue.status) {
      case "PASS":
        return "bg-emerald-100 text-emerald-700";
      case "WARNING":
        return "bg-amber-100 text-amber-700";
      case "FAIL":
        return "bg-rose-100 text-rose-700";
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <h4 className="font-bold text-base">{issue.category}</h4>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge()}`}
        >
          {issue.status}
        </span>
      </div>
      <p className="text-sm mb-4 opacity-90">{issue.description}</p>
      <div className="bg-white/60 rounded-xl p-4 border border-white/40">
        <p className="text-xs font-bold mb-2 opacity-60 uppercase tracking-wider">
          Recommendation
        </p>
        <p className="text-sm font-medium">{issue.recommendation}</p>
      </div>
    </div>
  );
};

export default function BrandComplianceTab({
  pageInfo,
  client,
}: {
  pageInfo?: PagesContext;
  client: ClientSDK | null;
}) {
  const [guidelines, setGuidelines] = useState<BrandGuidelines>({
    brandOverview: `Forma Lux embodies the perfect fusion of modern European design,
craftsmanship, and minimalism. Our pieces are thoughtfully crafted
to create harmonious spaces that celebrate both beauty and
functionality. Each item reflects our commitment to timeless
elegance while ensuring a seamless integration into contemporary
living environments.`,
    missionVisionValues: `We design spaces that promote
tranquility, encouraging a serene
atmosphere for relaxation and
reflection in the hustle of modern
life.Luxury is not just opulence; it is
found in the timeless design and
exceptional craftsmanship that
creates enduring beauty and
simplicity in every piece.`,
    brandNarrative: `Forma Lux was born from a belief that furniture should do more than fill a space—it should illuminate it.
Guided by a philosophy that design is a form of quiet expression, Forma Lux unites modern minimalism with
timeless craftsmanship to create pieces that inspire calm, clarity, and connection.
Each collection is shaped by the interplay of form and light—luxurious yet restrained, sophisticated yet inviting.
Every curve, texture, and material is chosen not for ornamentation, but for meaning. From the subtle warmth
of natural wood to the precision of architectural silhouettes, Forma Lux celebrates the beauty of balance and
the art of thoughtful living.
Our name, derived from forma (shape) and lux (light), embodies this pursuit: to shape spaces that feel alive
with intention. Forma Lux exists for those who value authenticity, quality, and the quiet power of design done
well—a modern ode to living beautifully.`,
    colorPalette: ["#B89A5B", "#F9F7F4", "#1C1C1C", "#E5E3E1"],
    typographyFonts: ["DM Sans” Regular"],
    toneOfVoice: `Forma Lux content reflects the same qualities as its design — elegant, authentic, thoughtful,
and enduring. Every message should feel as intentional as the craftsmanship behind each
piece, combining modern minimalism with warmth and humanity.
We write not to impress, but to express — to illuminate the beauty of quiet design and the art
of living beautifully.Tone by Context
Product Descriptions
Tone: Elegant & precise
Example: “Crafted with enduring materials and a refined silhouette, the Arca Chair embodies quiet
sophistication.”
Marketing Copy
Tone: Warm & aspirational
Example: “Forma Lux invites you to rediscover beauty in the everyday — where light, material, and
form coexist in perfect balance.”
Editorial & Storytelling
Tone: Reflective & human
Example: “Our philosophy begins with intention — designing not for decoration, but for how a
space feels, functions, and inspires.”
Social Media
Tone: Conversational & sincere
Example: “True luxury isn’t louder — it’s the detail you feel every day.”
Word Palette
Preferred (Do):
Balance, light, form, craftsmanship, harmony, timeless, intentional, serene, refined, enduring.
Avoid (Don’t):
Cheap, trendy, bold, flashy, exaggerated, overdesigned.`,
    logoGuidelines: `The Forma Lux logo reflects the brand’s devotion to modern craftsmanship and timeless elegance. Its
clean, geometric typography balances strength with refinement—each letter thoughtfully spaced to evoke
harmony and sophistication. The warm golden hue symbolizes light, artistry, and enduring quality, while
the minimalist form speaks to simplicity and restraint. Together, these elements embody Forma Lux’s
philosophy: illuminating everyday living through design that is both functional and beautiful.`,
  });

  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<BrandAuditResult | null>(null);

  const updateGuideline = (
    field: keyof BrandGuidelines,
    value: string | string[]
  ) => {
    setGuidelines((prev) => ({ ...prev, [field]: value }));
  };

  const handleAudit = async () => {
    setLoading(true);
    setAuditResult(null);

    const pageData = await getPageStructure({
      token: secretApiToken,
      pageId: pageInfo?.pageInfo?.id || "",
    });

    const brandMetrics = await analyzeBrandCompliance(
      pageData.html,
      guidelines
    );

    setAuditResult(brandMetrics);
    setLoading(false);
  };

  const chartData = auditResult
    ? [
        {
          name: "Narrative Alignment",
          value: auditResult.visualMetrics.narrativeAlignment,
        },
        {
          name: "Structural Integrity",
          value: auditResult.visualMetrics.structuralIntegrity,
        },
        {
          name: "Tonal Consistency",
          value: auditResult.visualMetrics.tonalConsistency,
        },
      ]
    : [];

  const COLORS = ["#6366f1", "#10b981", "#f59e0b"];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  Brand Definition
                </h3>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                  Brand Overview
                </label>
                <textarea
                  rows={3}
                  value={guidelines.brandOverview}
                  onChange={(e) =>
                    updateGuideline("brandOverview", e.target.value)
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                  Mission, Vision and Values
                </label>
                <textarea
                  rows={3}
                  value={guidelines.missionVisionValues}
                  onChange={(e) =>
                    updateGuideline("missionVisionValues", e.target.value)
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                  Brand Narrative
                </label>
                <textarea
                  rows={3}
                  value={guidelines.brandNarrative}
                  onChange={(e) =>
                    updateGuideline("brandNarrative", e.target.value)
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                  Tone of Voice
                </label>
                <textarea
                  rows={3}
                  value={guidelines.toneOfVoice}
                  onChange={(e) =>
                    updateGuideline("toneOfVoice", e.target.value)
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="space-y-4">
                {/* <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                    Primary Colors
                  </label>
                  <input
                    type="text"
                    value={guidelines.colorPalette.join(", ")}
                    onChange={(e) =>
                      updateGuideline(
                        "colorPalette",
                        e.target.value.split(",").map((s) => s.trim())
                      )
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div> */}

                {/* <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                    Font Families
                  </label>
                  <input
                    type="text"
                    value={guidelines.typographyFonts.join(", ")}
                    onChange={(e) =>
                      updateGuideline(
                        "typographyFonts",
                        e.target.value.split(",").map((s) => s.trim())
                      )
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div> */}

                {/* <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
                    Logo Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={guidelines.logoGuidelines}
                    onChange={(e) =>
                      updateGuideline("logoGuidelines", e.target.value)
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                  />
                </div> */}
              </div>

              <button
                onClick={handleAudit}
                disabled={loading}
                className={`w-full mt-8 py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Fetching Sitecore Content...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run Compliance Audit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            {!auditResult && !loading && (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center group">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Audit Desk Ready
                </h3>
                <p className="max-w-md text-slate-500">
                  Configure your brand guidelines on the left. Once triggered,
                  the engine will fetch the live DOM from Sitecore and evaluate
                  against your rules.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800 mb-2">
                  Analyzing
                </p>
                <p className="text-slate-400 text-sm animate-pulse">
                  Scanning DOM trees and evaluating brand tone...
                </p>
              </div>
            )}

            {auditResult && !loading && (
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
                          stroke={
                            auditResult.overallScore > 80
                              ? "#10b981"
                              : auditResult.overallScore > 60
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeDasharray={351.8}
                          strokeDashoffset={
                            351.8 - (351.8 * auditResult.overallScore) / 100
                          }
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="text-4xl font-black text-slate-800 tracking-tighter">
                        {auditResult.overallScore}%
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Compliance Score
                    </p>
                  </div>

                  {/* Metrics Bar Chart */}
                  <div className="md:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.2em]">
                      Dimension Breakdown
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

                <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">
                      Audit Narrative
                    </h3>
                  </div>
                  <p className="text-lg font-medium leading-relaxed">
                    {auditResult.summary}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Compliance Findings
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {
                          auditResult.issues.filter((i) => i.status === "FAIL")
                            .length
                        }{" "}
                        Critical
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                        <Circle className="w-1.5 h-1.5 fill-current" />
                        {
                          auditResult.issues.filter(
                            (i) => i.status === "WARNING"
                          ).length
                        }{" "}
                        Warnings
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {auditResult.issues.map((issue, idx) => (
                      <ComplianceCard key={idx} issue={issue} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
