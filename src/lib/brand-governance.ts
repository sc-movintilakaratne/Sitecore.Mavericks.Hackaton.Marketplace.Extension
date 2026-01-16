import { GoogleGenAI, Type } from "@google/genai";

export enum ComplianceStatus {
  PASS = "PASS",
  WARNING = "WARNING",
  FAIL = "FAIL",
}

export interface ComplianceIssue {
  category: string;
  status: ComplianceStatus;
  description: string;
  location?: string;
  recommendation: string;
}

export interface BrandAuditResult {
  overallScore: number;
  summary: string;
  issues: ComplianceIssue[];
  visualMetrics: {
    narrativeAlignment: number;
    visualIdentity: number;
    tonalConsistency: number;
    structuralIntegrity: number;
  };
}

export interface BrandGuidelines {
  brandOverview: string;
  missionVisionValues: string;
  brandNarrative: string;
  logoGuidelines: string;
  colorPalette: string[];
  typographyFonts: string[];
  toneOfVoice: string;
}

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
});

export const analyzeBrandCompliance = async (
  html: string,
  guidelines: BrandGuidelines
): Promise<BrandAuditResult> => {
  const prompt = `
    Analyze the following HTML source code for strict brand compliance against these seven pillars:
    
    1. Brand Overview: ${guidelines.brandOverview}
    2. Mission, Vision, Values: ${guidelines.missionVisionValues}
    3. Brand Narrative: ${guidelines.brandNarrative}
    4. Tone of Voice: ${guidelines.toneOfVoice}

    Critical Checks:
    - Content must reflect the Brand Narrative and Tone of Voice.

    HTML Source:
    ${html.substring(0, 30000)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                status: {
                  type: Type.STRING,
                  description: "PASS, WARNING, or FAIL",
                },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                recommendation: { type: Type.STRING },
              },
              required: ["category", "status", "description", "recommendation"],
            },
          },
          visualMetrics: {
            type: Type.OBJECT,
            properties: {
              narrativeAlignment: {
                type: Type.NUMBER,
                description: "Score for Pillar 1, 2, 3",
              },
              tonalConsistency: {
                type: Type.NUMBER,
                description: "Score for Pillar 7",
              },
              structuralIntegrity: {
                type: Type.NUMBER,
                description: "Overall code quality and component usage",
              },
            },
            required: [
              "narrativeAlignment",
              "tonalConsistency",
              "structuralIntegrity",
            ],
          },
        },
        required: ["overallScore", "summary", "issues", "visualMetrics"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as BrandAuditResult;
};
