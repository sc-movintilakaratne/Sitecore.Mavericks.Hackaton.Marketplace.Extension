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
          <div className="mt-6 border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Head SEO Report</h4>
              <button
                onClick={() => setSelectedPageForHeadSeo(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Page:</span> {selectedPageForHeadSeo.path || selectedPageForHeadSeo.id}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">ID:</span> {selectedPageForHeadSeo.id}
              </p>
            </div>

            {(() => {
              const headSeo = headSeoScores[selectedPageForHeadSeo.id];
              const getScoreColor = (score: number) => {
                if (score === 100) return "text-green-600 bg-green-50 border-green-200";
                if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
                return "text-red-600 bg-red-50 border-red-200";
              };

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
                <div className="space-y-3">
                  {headSeoItems.map((item) => (
                    <div
                      key={item.key}
                      className={`p-4 rounded-lg border ${getScoreColor(item.data.score)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${getScoreColor(item.data.score)}`}>
                          {item.data.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">{item.data.message}</p>
                      {item.data.value && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">Value:</p>
                          <p className="text-xs text-gray-800 break-words">{item.data.value}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* SEO Report Section */}
        {selectedPageForReport && seoScores[selectedPageForReport.id] && (
          <div className="mt-6 border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">SEO Report</h4>
              <button
                onClick={() => setSelectedPageForReport(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Page:</span> {selectedPageForReport.path || selectedPageForReport.id}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">ID:</span> {selectedPageForReport.id}
              </p>
            </div>

            {(() => {
              const seoScore = seoScores[selectedPageForReport.id];
              const getScoreColor = (score: number) => {
                if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
                if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
                return "text-red-600 bg-red-50 border-red-200";
              };
              const getGradeColor = (grade: string) => {
                if (grade === "A") return "text-green-700 bg-green-100 border-green-300";
                if (grade === "B") return "text-blue-700 bg-blue-100 border-blue-300";
                if (grade === "C") return "text-yellow-700 bg-yellow-100 border-yellow-300";
                if (grade === "D") return "text-orange-700 bg-orange-100 border-orange-300";
                return "text-red-700 bg-red-100 border-red-300";
              };

              return (
                <>
                  {/* Overall Score */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`px-6 py-4 rounded-lg border-2 ${getScoreColor(seoScore.score)}`}>
                        <div className="text-3xl font-bold">{seoScore.score}</div>
                        <div className="text-xs font-medium mt-1">Score / 100</div>
                      </div>
                      {seoScore.grade && (
                        <div className={`px-6 py-4 rounded-lg border-2 ${getGradeColor(seoScore.grade)}`}>
                          <div className="text-3xl font-bold">{seoScore.grade}</div>
                          <div className="text-xs font-medium mt-1">Grade</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  {seoScore.details && (
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Analysis Details</h5>
                      <div className="space-y-3">
                        {seoScore.details.title && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Title Tag</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.title.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.title.score}/15</span>
                          </div>
                        )}
                        {seoScore.details.metaDescription && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Meta Description</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.metaDescription.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.metaDescription.score}/15</span>
                          </div>
                        )}
                        {seoScore.details.headings && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Headings</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.headings.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.headings.score}/20</span>
                          </div>
                        )}
                        {seoScore.details.images && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Images</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.images.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.images.score}/15</span>
                          </div>
                        )}
                        {seoScore.details.links && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Links</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.links.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.links.score}/10</span>
                          </div>
                        )}
                        {seoScore.details.content && (
                          <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">Content</span>
                              <p className="text-xs text-gray-600 mt-1">{seoScore.details.content.message}</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{seoScore.details.content.score}/15</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {seoScore.recommendations && seoScore.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Recommendations</h5>
                      <ul className="space-y-2">
                        {seoScore.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 mt-1">•</span>
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
        )}
      </div>
    </div>
  );
}
