import { useEffect, useState } from "react";
import { getPageContent } from "../api/sitecore/getPageContent";
import { getAuthToken } from "../api/sitecore/getAuthToken";
import { getAllPagesBySite } from "../api/sitecore/getAllPagesBySite";
import { getCollections } from "../api/sitecore/getCollections";
import { getSites } from "../api/sitecore/getSites";
import { getPageStructure } from "../api/sitecore/getPageStructure";
import { getSeoScore, SeoScoreResponse } from "../api/seo/getSeoScore";
import { analyzeHeadSeo, HeadSeoScoreResponse } from "../api/seo/getHeadSeoScore";
import { fakeToken } from "../utils/utilities/token";

interface Collection {
  id: string;
  name: string;
  [key: string]: any;
}

interface Site {
  id?: string;
  name: string;
  [key: string]: any;
}

interface Page {
  id: string;
  path?: string;
  [key: string]: any;
}

export function SeoAnalysisTab() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [pages, setPages] = useState<Page[]>([]);
  const [pageContent, setPageContent] = useState<any>({});
  const [token, setToken] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seoScores, setSeoScores] = useState<Record<string, SeoScoreResponse>>({});
  const [analyzingPages, setAnalyzingPages] = useState<Record<string, boolean>>({});
  const [analyzingHeadSeo, setAnalyzingHeadSeo] = useState<Record<string, boolean>>({});
  const [selectedPageForReport, setSelectedPageForReport] = useState<Page | null>(null);
  const [selectedPageForHeadSeo, setSelectedPageForHeadSeo] = useState<Page | null>(null);
  const [headSeoScores, setHeadSeoScores] = useState<Record<string, HeadSeoScoreResponse>>({});
  const [expandedHeadSeoItems, setExpandedHeadSeoItems] = useState<Record<string, Set<string>>>({});
  const [expandedSeoItems, setExpandedSeoItems] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState({
    collections: false,
    sites: false,
    pages: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzePage = async (page: Page) => {
    try {
      // Set analyzing state
      setAnalyzingPages((prev) => ({ ...prev, [page.id]: true }));
      setError(null);

      // Get page HTML content
      const pageData = await getPageStructure({
        token: fakeToken,
        pageId: page.id
      });

      if (!pageData?.html) {
        throw new Error("Failed to retrieve page HTML content");
      }

      // Get SEO score from external API
      const seoScore = await getSeoScore({
        html: pageData.html,
        url: page.path,
      });

      // Store the SEO score
      setSeoScores((prev) => ({
        ...prev,
        [page.id]: seoScore,
      }));

      // Set the page for report display
      setSelectedPageForReport(page);
    } catch (err) {
      console.error("Error analyzing page:", err);
      setError(`Failed to analyze page: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      // Clear analyzing state
      setAnalyzingPages((prev) => {
        const newState = { ...prev };
        delete newState[page.id];
        return newState;
      });
    }
  };

  const handleAnalyzeHeadSeo = async (page: Page) => {
    try {
      // Set analyzing state
      setAnalyzingHeadSeo((prev) => ({ ...prev, [page.id]: true }));
      setError(null);

      // Get page HTML content
      const pageData = await getPageStructure({
        token: fakeToken,
        pageId: page.id
      });

      if (!pageData?.html) {
        throw new Error("Failed to retrieve page HTML content");
      }

      // Analyze head SEO elements
      const headSeoResults = analyzeHeadSeo(pageData.html);

      // Store the head SEO results
      setHeadSeoScores((prev) => ({
        ...prev,
        [page.id]: headSeoResults,
      }));

      // Set the page for head SEO report display
      setSelectedPageForHeadSeo(page);
    } catch (err) {
      console.error("Error analyzing head SEO:", err);
      setError(`Failed to analyze head SEO: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      // Clear analyzing state
      setAnalyzingHeadSeo((prev) => {
        const newState = { ...prev };
        delete newState[page.id];
        return newState;
      });
    }
  };

  const fetchCollections = async () => {
    try {
      setLoading((prev) => ({ ...prev, collections: true }));
      setError(null);
      const data = await getCollections({ token: fakeToken });

      // Handle different response structures
      let collectionsData: Collection[] = [];
      if (Array.isArray(data)) {
        collectionsData = data;
      } else if (data?.items) {
        collectionsData = data.items;
      } else if (data?.data) {
        collectionsData = Array.isArray(data.data) ? data.data : [];
      }

      setCollections(collectionsData);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError("Failed to load collections");
    } finally {
      setLoading((prev) => ({ ...prev, collections: false }));
    }
  };

  const fetchSites = async () => {
    try {
      setLoading((prev) => ({ ...prev, sites: true }));
      setError(null);
      setSelectedSite(""); // Reset site selection
      setPages([]); // Clear pages when collection changes

      const data = await getSites({
        token: fakeToken,
        collectionId: selectedCollection
      });

      // Handle different response structures
      let sitesData: Site[] = [];
      if (Array.isArray(data)) {
        sitesData = data;
      } else if (data?.items) {
        sitesData = data.items;
      } else if (data?.data) {
        sitesData = Array.isArray(data.data) ? data.data : [];
      }

      setSites(sitesData);
    } catch (err) {
      console.error("Error fetching sites:", err);
      setError("Failed to load sites for selected collection");
    } finally {
      setLoading((prev) => ({ ...prev, sites: false }));
    }
  };

  const fetchPages = async () => {
      try {
        setLoading((prev) => ({ ...prev, pages: true }));
        setError(null);

        const data = await getAllPagesBySite({
          token: fakeToken,
          siteName: selectedSite,
        });

        // Handle different response structures
        let pagesData: Page[] = [];
        if (Array.isArray(data)) {
          pagesData = data;
        } else if (data?.items) {
          pagesData = data.items;
        } else if (data?.data) {
          pagesData = Array.isArray(data.data) ? data.data : [];
        }

        setPages(pagesData);
      } catch (err) {
        console.error("Error fetching pages:", err);
        setError("Failed to load pages for selected site");
      } finally {
        setLoading((prev) => ({ ...prev, pages: false }));
      }
    };

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch sites when collection is selected
  useEffect(() => {
    if (!selectedCollection) {
      setSites([]);
      setSelectedSite("");
      setPages([]);
      return;
    }

    fetchSites();
  }, [selectedCollection]);

  // Fetch pages when site is selected
  useEffect(() => {
    if (!selectedSite) {
      setPages([]);
      setSearchQuery(""); // Reset search when site changes
      setSelectedPageForReport(null); // Clear report when site changes
      setSelectedPageForHeadSeo(null); // Clear head SEO report when site changes
      setExpandedHeadSeoItems({}); // Clear expanded state
      setExpandedSeoItems({}); // Clear expanded state
      return;
    }

    fetchPages();
  }, [selectedSite]);

  // Filter pages based on search query
  const filteredPages = pages.filter((page) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const pagePath = (page.path || "").toLowerCase();
    const pageId = (page.id || "").toLowerCase();
    return pagePath.includes(query) || pageId.includes(query);
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">SEO Analysis</h3>
      <p className="text-gray-700 text-sm mb-6">
        Analyze your content for SEO best practices and get actionable insights
        to improve your search engine rankings. Select a collection, site, and
        page to analyze.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Collections Dropdown */}
        <div>
          <label
            htmlFor="collection-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Collection
          </label>
          <select
            id="collection-select"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            disabled={loading.collections}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a collection...</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name || collection.id}
              </option>
            ))}
          </select>
          {loading.collections && (
            <p className="text-xs text-gray-500 mt-1">Loading collections...</p>
          )}
        </div>

        {/* Sites List */}
        {selectedCollection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sites ({sites.length})
            </label>
            {loading.sites ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>Loading sites...</span>
              </div>
            ) : sites.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm">
                  No sites found for this collection
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {sites.map((site) => {
                    const siteId = site.id || site.name;
                    const isSelected = selectedSite === (site.name || site.id);
                    return (
                      <li
                        key={siteId}
                        onClick={() => setSelectedSite(site.name || site.id || "")}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {site.name || site.id}
                          </span>
                          {site.id && site.id !== site.name && (
                            <span className="text-xs text-gray-500 mt-1">
                              ID: {site.id}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Pages List */}
        {selectedSite && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Pages ({pages.length})
              </label>
              {!loading.pages && pages.length > 0 && (
                <span className="text-xs text-gray-500">
                  {filteredPages.length} {filteredPages.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>
            {loading.pages ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>Loading pages...</span>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm">
                  No pages found for this site
                </p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search pages by path or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                {filteredPages.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm">
                      No pages found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {filteredPages.map((page) => {
                        const isAnalyzing = analyzingPages[page.id];
                        return (
                          <li
                            key={page.id}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col flex-1">
                                <span className="font-medium text-sm">
                                  {page.path || page.id}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  ID: {page.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleAnalyzeHeadSeo(page)}
                                  disabled={analyzingHeadSeo[page.id]}
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {analyzingHeadSeo[page.id] ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    "Analyze Head SEO"
                                  )}
                                </button>
                                <button
                                  onClick={() => handleAnalyzePage(page)}
                                  disabled={isAnalyzing}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {isAnalyzing ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    "Analyze Full Page"
                                  )}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Head SEO Report Section */}
        {selectedPageForHeadSeo && headSeoScores[selectedPageForHeadSeo.id] && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Head SEO</h4>
              <button
                onClick={() => setSelectedPageForHeadSeo(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              {/* Page Info */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Page:</span> {selectedPageForHeadSeo.path || selectedPageForHeadSeo.id}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">ID:</span> {selectedPageForHeadSeo.id}
                </p>
              </div>

              {(() => {
                const headSeo = headSeoScores[selectedPageForHeadSeo.id];
                
                // Calculate average score
                const scores = [
                  headSeo.title.score,
                  headSeo.metaDescription.score,
                  headSeo.metaKeywords.score,
                  headSeo.ogTitle.score,
                  headSeo.ogDescription.score,
                  headSeo.ogImage.score,
                  headSeo.ogUrl.score,
                ];
                const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

                const getScoreColor = (score: number) => {
                  if (score >= 90) return { bg: "bg-green-500", text: "text-green-600", border: "border-green-200", bgLight: "bg-green-50" };
                  if (score >= 50) return { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", bgLight: "bg-orange-50" };
                  return { bg: "bg-red-500", text: "text-red-600", border: "border-red-200", bgLight: "bg-red-50" };
                };

                const scoreColor = getScoreColor(avgScore);
                const circumference = 2 * Math.PI * 45; // radius = 45
                const offset = circumference - (avgScore / 100) * circumference;

                const headSeoItems = [
                  { key: 'title', label: 'Title', data: headSeo.title },
                  { key: 'metaDescription', label: 'Meta Description', data: headSeo.metaDescription },
                  { key: 'metaKeywords', label: 'Meta Keywords', data: headSeo.metaKeywords },
                  { key: 'ogTitle', label: 'OG Title', data: headSeo.ogTitle },
                  { key: 'ogDescription', label: 'OG Description', data: headSeo.ogDescription },
                  { key: 'ogImage', label: 'OG Image', data: headSeo.ogImage },
                  { key: 'ogUrl', label: 'OG URL', data: headSeo.ogUrl },
                ];

                return (
                  <>
                    {/* Score Gauge */}
                    <div className="flex justify-center mb-8">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`${scoreColor.bg} transition-all duration-500`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${scoreColor.text}`}>{avgScore}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics List */}
                    <div className="space-y-2">
                      {headSeoItems.map((item) => {
                        const itemColor = getScoreColor(item.data.score);
                        const itemCircumference = 2 * Math.PI * 12;
                        const itemOffset = itemCircumference - (item.data.score / 100) * itemCircumference;
                        const expandedSet = expandedHeadSeoItems[selectedPageForHeadSeo.id] || new Set();
                        const isExpanded = expandedSet.has(item.key);

                        const toggleExpanded = () => {
                          setExpandedHeadSeoItems(prev => {
                            const pageId = selectedPageForHeadSeo.id;
                            const currentSet = prev[pageId] || new Set();
                            const newSet = new Set(currentSet);
                            if (isExpanded) {
                              newSet.delete(item.key);
                            } else {
                              newSet.add(item.key);
                            }
                            return { ...prev, [pageId]: newSet };
                          });
                        };

                        return (
                          <div
                            key={item.key}
                            className={`border rounded-lg ${itemColor.border} ${itemColor.bgLight} transition-colors`}
                          >
                            <button
                              onClick={toggleExpanded}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative w-8 h-8 flex-shrink-0">
                                  <svg className="transform -rotate-90 w-8 h-8">
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="12"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      fill="none"
                                      className="text-gray-200"
                                    />
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="12"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      fill="none"
                                      strokeDasharray={itemCircumference}
                                      strokeDashoffset={itemOffset}
                                      strokeLinecap="round"
                                      className={itemColor.bg}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-xs font-bold ${itemColor.text}`}>
                                      {item.data.score}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-semibold ${itemColor.text}`}>
                                  {item.data.score}/100
                                </span>
                                <svg
                                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-3 mt-2">{item.data.message}</p>
                                {item.data.value && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Value:</p>
                                    <p className="text-xs text-gray-800 break-words">{item.data.value}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* SEO Report Section */}
        {selectedPageForReport && seoScores[selectedPageForReport.id] && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">SEO</h4>
              <button
                onClick={() => setSelectedPageForReport(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              {/* Page Info */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Page:</span> {selectedPageForReport.path || selectedPageForReport.id}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">ID:</span> {selectedPageForReport.id}
                </p>
              </div>

              {(() => {
                const seoScore = seoScores[selectedPageForReport.id];
                
                const getScoreColor = (score: number) => {
                  if (score >= 90) return { bg: "bg-green-500", text: "text-green-600", border: "border-green-200", bgLight: "bg-green-50" };
                  if (score >= 50) return { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", bgLight: "bg-orange-50" };
                  return { bg: "bg-red-500", text: "text-red-600", border: "border-red-200", bgLight: "bg-red-50" };
                };

                const scoreColor = getScoreColor(seoScore.score);
                const circumference = 2 * Math.PI * 45; // radius = 45
                const offset = circumference - (seoScore.score / 100) * circumference;

                const details = seoScore.details || {};
                const detailItems = [
                  { key: 'title', label: 'Title Tag', data: details.title, maxScore: 15 },
                  { key: 'metaDescription', label: 'Meta Description', data: details.metaDescription, maxScore: 15 },
                  { key: 'headings', label: 'Headings', data: details.headings, maxScore: 20 },
                  { key: 'images', label: 'Images', data: details.images, maxScore: 15 },
                  { key: 'links', label: 'Links', data: details.links, maxScore: 10 },
                  { key: 'content', label: 'Content', data: details.content, maxScore: 15 },
                ].filter(item => item.data);

                return (
                  <>
                    {/* Score Gauge */}
                    <div className="flex justify-center mb-8">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`${scoreColor.bg} transition-all duration-500`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${scoreColor.text}`}>{seoScore.score}</div>
                            {seoScore.grade && (
                              <div className={`text-sm font-semibold ${scoreColor.text} mt-1`}>{seoScore.grade}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics List */}
                    {detailItems.length > 0 && (
                      <div className="space-y-2 mb-6">
                        {detailItems.map((item) => {
                          if (!item.data) return null;
                          const itemScore = Math.round((item.data.score / item.maxScore) * 100);
                          const itemColor = getScoreColor(itemScore);
                          const itemCircumference = 2 * Math.PI * 12;
                          const itemOffset = itemCircumference - (itemScore / 100) * itemCircumference;
                          const expandedSet = expandedSeoItems[selectedPageForReport.id] || new Set();
                          const isExpanded = expandedSet.has(item.key);

                          const toggleExpanded = () => {
                            setExpandedSeoItems(prev => {
                              const pageId = selectedPageForReport.id;
                              const currentSet = prev[pageId] || new Set();
                              const newSet = new Set(currentSet);
                              if (isExpanded) {
                                newSet.delete(item.key);
                              } else {
                                newSet.add(item.key);
                              }
                              return { ...prev, [pageId]: newSet };
                            });
                          };

                          return (
                            <div
                              key={item.key}
                              className={`border rounded-lg ${itemColor.border} ${itemColor.bgLight} transition-colors`}
                            >
                              <button
                                onClick={toggleExpanded}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="relative w-8 h-8 flex-shrink-0">
                                    <svg className="transform -rotate-90 w-8 h-8">
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="12"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        className="text-gray-200"
                                      />
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="12"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeDasharray={itemCircumference}
                                        strokeDashoffset={itemOffset}
                                        strokeLinecap="round"
                                        className={itemColor.bg}
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className={`text-xs font-bold ${itemColor.text}`}>
                                        {itemScore}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-semibold ${itemColor.text}`}>
                                    {item.data.score}/{item.maxScore}
                                  </span>
                                  <svg
                                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mt-2">{item.data.message}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Recommendations */}
                    {seoScore.recommendations && seoScore.recommendations.length > 0 && (
                      <div className="border-t border-gray-200 pt-6">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Opportunities</h5>
                        <ul className="space-y-2">
                          {seoScore.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
