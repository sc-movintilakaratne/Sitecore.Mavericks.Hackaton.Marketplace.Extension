export type HeadSeoElement = {
  score: number;
  message: string;
  value?: string;
};

export type HeadSeoScoreResponse = {
  title: HeadSeoElement;
  metaDescription: HeadSeoElement;
  metaKeywords: HeadSeoElement;
  ogTitle: HeadSeoElement;
  ogDescription: HeadSeoElement;
  ogImage: HeadSeoElement;
  ogUrl: HeadSeoElement;
};

/**
 * Analyzes HTML head elements for SEO optimization
 * Checks Title, Meta Description, Meta Keywords, and Open Graph tags
 */
export const analyzeHeadSeo = (html: string): HeadSeoScoreResponse => {
  const results: HeadSeoScoreResponse = {
    title: { score: 0, message: "", value: "" },
    metaDescription: { score: 0, message: "", value: "" },
    metaKeywords: { score: 0, message: "", value: "" },
    ogTitle: { score: 0, message: "", value: "" },
    ogDescription: { score: 0, message: "", value: "" },
    ogImage: { score: 0, message: "", value: "" },
    ogUrl: { score: 0, message: "", value: "" },
  };

  // Analyze Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    const titleLength = title.length;
    results.title.value = title;
    if (titleLength > 0 && titleLength <= 60) {
      results.title.score = 100;
      results.title.message = `Title is present and optimal length (${titleLength} characters)`;
    } else if (titleLength > 60) {
      results.title.score = 50;
      results.title.message = `Title is too long (${titleLength} characters, recommended: 60 or less)`;
    } else {
      results.title.score = 0;
      results.title.message = "Title is empty";
    }
  } else {
    results.title.score = 0;
    results.title.message = "Title tag is missing";
  }

  // Analyze Meta Description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDescMatch && metaDescMatch[1]) {
    const desc = metaDescMatch[1].trim();
    const descLength = desc.length;
    results.metaDescription.value = desc;
    if (descLength > 0 && descLength <= 160) {
      results.metaDescription.score = 100;
      results.metaDescription.message = `Meta description is present and optimal length (${descLength} characters)`;
    } else if (descLength > 160) {
      results.metaDescription.score = 50;
      results.metaDescription.message = `Meta description is too long (${descLength} characters, recommended: 160 or less)`;
    } else {
      results.metaDescription.score = 0;
      results.metaDescription.message = "Meta description is empty";
    }
  } else {
    results.metaDescription.score = 0;
    results.metaDescription.message = "Meta description tag is missing";
  }

  // Analyze Meta Keywords
  const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  if (metaKeywordsMatch && metaKeywordsMatch[1]) {
    const keywords = metaKeywordsMatch[1].trim();
    results.metaKeywords.value = keywords;
    if (keywords.length > 0) {
      results.metaKeywords.score = 100;
      results.metaKeywords.message = `Meta keywords are present (${keywords.split(',').length} keywords)`;
    } else {
      results.metaKeywords.score = 0;
      results.metaKeywords.message = "Meta keywords are empty";
    }
  } else {
    results.metaKeywords.score = 0;
    results.metaKeywords.message = "Meta keywords tag is missing";
  }

  // Analyze OG Title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    const ogTitle = ogTitleMatch[1].trim();
    results.ogTitle.value = ogTitle;
    results.ogTitle.score = 100;
    results.ogTitle.message = `OG title is present (${ogTitle.length} characters)`;
  } else {
    results.ogTitle.score = 0;
    results.ogTitle.message = "OG title (og:title) is missing";
  }

  // Analyze OG Description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    const ogDesc = ogDescMatch[1].trim();
    results.ogDescription.value = ogDesc;
    results.ogDescription.score = 100;
    results.ogDescription.message = `OG description is present (${ogDesc.length} characters)`;
  } else {
    results.ogDescription.score = 0;
    results.ogDescription.message = "OG description (og:description) is missing";
  }

  // Analyze OG Image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    const ogImage = ogImageMatch[1].trim();
    results.ogImage.value = ogImage;
    results.ogImage.score = 100;
    results.ogImage.message = "OG image is present";
  } else {
    results.ogImage.score = 0;
    results.ogImage.message = "OG image (og:image) is missing";
  }

  // Analyze OG URL
  const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
  if (ogUrlMatch && ogUrlMatch[1]) {
    const ogUrl = ogUrlMatch[1].trim();
    results.ogUrl.value = ogUrl;
    results.ogUrl.score = 100;
    results.ogUrl.message = "OG URL is present";
  } else {
    results.ogUrl.score = 0;
    results.ogUrl.message = "OG URL (og:url) is missing";
  }

  return results;
};

