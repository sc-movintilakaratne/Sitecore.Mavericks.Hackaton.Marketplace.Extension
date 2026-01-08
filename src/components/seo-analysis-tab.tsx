import { useEffect, useState } from "react";
import { getPageContent } from "../api/sitecore/getPageContent";
import { getAuthToken } from "../api/sitecore/getAuthToken";
import { getAllPagesBySite } from "../api/sitecore/getAllPagesBySite";
import { getCollections } from "../api/sitecore/getCollections";
import { getSites } from "../api/sitecore/getSites";
import { getPageStructure } from "../api/sitecore/getPageStructure";
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
  const [loading, setLoading] = useState({
    collections: false,
    sites: false,
    pages: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzePage = (page: Page) => {
    // TODO: Implement page analysis functionality
    console.log("Analyzing page:", page);
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
      return;
    }

    fetchPages();
  }, [selectedSite]);

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pages ({pages.length})
            </label>
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
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {pages.map((page) => (
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
                        <button
                          onClick={() => handleAnalyzePage(page)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Analyze page
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
