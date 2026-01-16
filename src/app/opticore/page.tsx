"use client";

import { useState, useEffect } from "react";
import type {
  ApplicationContext,
  PagesContext,
} from "@sitecore-marketplace-sdk/client";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { SeoAnalysisTab } from "@/src/components/seo-analysis-tab";
import { BrokenLinkDetectionTab } from "@/src/components/broken-link-detection-tab";
import { BrandComplianceTab } from "@/src/components/brand-compliance-tab";
import ContentGenerationTab from "@/src/components/content-generation-tab";

function PagesContextPanel() {
  const { client, error, isInitialized } = useMarketplaceClient();
  const [pagesContext, setPagesContext] = useState<PagesContext>();
  const [appContext, setAppContext] = useState<ApplicationContext>();

  useEffect(() => {
    if (!error && isInitialized && client) {
      client
        .query("application.context")
        .then((res) => {
          console.log("Success retrieving application.context:", res.data);
          setAppContext(res.data);
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });

      client
        .query("pages.context", {
          subscribe: true,
          onSuccess: (res) => {
            console.log("Success retrieving pages.context:", res);
            setPagesContext(res);
          },
        })
        .catch((error) => {
          console.error("Error retrieving pages.context:", error);
        });
    } else if (error) {
      console.error("Error initializing Marketplace client:", error);
    }
  }, [client, error, isInitialized]);

  return (
    <div className="p-5 mx-auto my-8 ">
      <h4>OptiCore</h4>
      <p className="text-gray-700 text-sm">
        Enhance your content with AI-powered SEO analysis, broken link
        detection, brand compliance checking, and intelligent content
        generation.
      </p>
      {/* {isInitialized && pagesContext ? ( */}
      {true ? (
        <div className="mt-8">
          <Tabs defaultValue="seo">
            <TabsList className="mx-auto mb-3 overflow-x-auto max-w-full justify-start">
              <TabsTrigger value="seo">SEO Analysis</TabsTrigger>
              <TabsTrigger value="links">Broken Link Detection</TabsTrigger>
              <TabsTrigger value="compliance">Brand Compliance</TabsTrigger>
              <TabsTrigger value="generation">Content Generation</TabsTrigger>
            </TabsList>
            <TabsContent value="seo">
              <SeoAnalysisTab client={client} pagesContext={pagesContext} appContext={appContext} />
            </TabsContent>
            <TabsContent value="links">
              <BrokenLinkDetectionTab />
            </TabsContent>
            <TabsContent value="compliance">
              <BrandComplianceTab />
            </TabsContent>
            <TabsContent value="generation">
              <ContentGenerationTab />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading page context...</p>
        </div>
      )}
    </div>
  );
}

export default PagesContextPanel;
