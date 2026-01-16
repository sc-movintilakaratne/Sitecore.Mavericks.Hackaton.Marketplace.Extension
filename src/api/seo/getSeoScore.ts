import axiosClient from "@/src/config/axiosClient";

export type SeoScoreResponse = {
  score: number; // 0-100
  grade?: string; // A, B, C, D, F
  details?: {
    title?: { score: number; message?: string };
    metaDescription?: { score: number; message?: string };
    headings?: { score: number; message?: string };
    images?: { score: number; message?: string };
    links?: { score: number; message?: string };
    content?: { score: number; message?: string };
  };
  recommendations?: string[];
};

export type getSeoScoreType = {
  html: string;
  url?: string;
};

/**
 * Analyzes HTML content and returns an SEO score
 * This function calls an external SEO analysis API
 */
export const getSeoScore = async ({
  html,
}: getSeoScoreType): Promise<SeoScoreResponse> => {
  try {
    // You can replace this with your preferred SEO API (e.g., PageSpeed Insights, Lighthouse, etc.)
    const apiUrl = process.env.NEXT_PUBLIC_SEO_API_URL || "https://api.example.com/seo/analyze";
    
    const resp = await axiosClient.post(
      apiUrl,
      {
        html,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // If the API returns data in a different format, transform it here
    const data = resp.data;

    // Return standardized format
    return {
      score: data.score || data.seoScore || 0,
      grade: data.grade || getGradeFromScore(data.score || data.seoScore || 0),
      details: data.details || data.analysis || {},
      recommendations: data.recommendations || data.suggestions || [],
    };
  } catch (error) {
    console.error("Error fetching SEO score:", error);
    
    // Fallback: Calculate a basic SEO score from HTML
    return calculateBasicSeoScore(html);
  }
};

/**
 * Helper function to calculate a basic SEO score from HTML
 * This is a fallback when the external API is not available
 */
function calculateBasicSeoScore(html: string): SeoScoreResponse {
  const htmlLower = html.toLowerCase();
  let score = 0;
  const details: SeoScoreResponse["details"] = {};
  const recommendations: string[] = [];

  // Check for title tag
  const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
  if (hasTitle) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titleLength = titleMatch ? titleMatch[1].length : 0;
    if (titleLength > 0 && titleLength <= 60) {
      score += 15;
      details.title = { score: 15, message: "Title tag is present and optimal length" };
    } else if (titleLength > 60) {
      score += 10;
      details.title = { score: 10, message: "Title tag is too long" };
      recommendations.push("Title tag should be 60 characters or less");
    } else {
      details.title = { score: 0, message: "Title tag is missing or empty" };
      recommendations.push("Add a descriptive title tag");
    }
  } else {
    details.title = { score: 0, message: "Title tag is missing" };
    recommendations.push("Add a title tag");
  }

  // Check for meta description
  const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.test(html);
  if (hasMetaDescription) {
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const descLength = metaMatch ? metaMatch[1].length : 0;
    if (descLength > 0 && descLength <= 160) {
      score += 15;
      details.metaDescription = { score: 15, message: "Meta description is present and optimal length" };
    } else if (descLength > 160) {
      score += 10;
      details.metaDescription = { score: 10, message: "Meta description is too long" };
      recommendations.push("Meta description should be 160 characters or less");
    } else {
      details.metaDescription = { score: 0, message: "Meta description is missing or empty" };
      recommendations.push("Add a meta description");
    }
  } else {
    details.metaDescription = { score: 0, message: "Meta description is missing" };
    recommendations.push("Add a meta description tag");
  }

  // Check for headings (h1, h2, h3)
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  
  if (h1Count === 1) {
    score += 15;
    details.headings = { score: 15, message: "Proper heading structure (1 H1 tag)" };
  } else if (h1Count > 1) {
    score += 10;
    details.headings = { score: 10, message: "Multiple H1 tags found" };
    recommendations.push("Use only one H1 tag per page");
  } else {
    score += 5;
    details.headings = { score: 5, message: "No H1 tag found" };
    recommendations.push("Add an H1 heading tag");
  }

  if (h2Count > 0 || h3Count > 0) {
    score += 5;
  }

  // Check for images with alt text
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgWithAlt = imgTags.filter((img) => /alt=["'][^"']+["']/i.test(img)).length;
  if (imgTags.length > 0) {
    const altPercentage = (imgWithAlt / imgTags.length) * 100;
    if (altPercentage === 100) {
      score += 15;
      details.images = { score: 15, message: "All images have alt text" };
    } else if (altPercentage >= 50) {
      score += 10;
      details.images = { score: 10, message: `${Math.round(altPercentage)}% of images have alt text` };
      recommendations.push("Add alt text to all images");
    } else {
      score += 5;
      details.images = { score: 5, message: `${Math.round(altPercentage)}% of images have alt text` };
      recommendations.push("Add alt text to all images");
    }
  } else {
    details.images = { score: 0, message: "No images found" };
  }

  // Check for links
  const linkCount = (html.match(/<a[^>]*href=["'][^"']+["'][^>]*>/gi) || []).length;
  if (linkCount > 0) {
    score += 10;
    details.links = { score: 10, message: `${linkCount} links found` };
  } else {
    details.links = { score: 0, message: "No links found" };
    recommendations.push("Add internal and external links");
  }

  // Check for content length
  const textContent = html.replace(/<[^>]*>/g, "").trim();
  const contentLength = textContent.length;
  if (contentLength > 300) {
    score += 15;
    details.content = { score: 15, message: "Sufficient content length" };
  } else if (contentLength > 100) {
    score += 10;
    details.content = { score: 10, message: "Content could be longer" };
    recommendations.push("Add more content to improve SEO");
  } else {
    score += 5;
    details.content = { score: 5, message: "Content is too short" };
    recommendations.push("Add more content (at least 300 words recommended)");
  }

  // Ensure score doesn't exceed 100
  score = Math.min(score, 100);

  return {
    score: Math.round(score),
    grade: getGradeFromScore(score),
    details,
    recommendations,
  };
}

/**
 * Convert numeric score to letter grade
 */
function getGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

