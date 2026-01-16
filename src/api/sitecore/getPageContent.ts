import axiosClient from "@/src/config/axiosClient";
import { getPageContentType } from "@/src/types/types";

export const getPageContent = async ({ site, language, version, environmentId, pageid, token }: getPageContentType) => {
  const query = new URLSearchParams({
    site: site,
    language: language,
    version: version,
    environmentId: environmentId,
  }).toString();

  try {
    const pageId = pageid;
    const resp = await axiosClient.get(
      `https://xmapps-api.sitecorecloud.io/api/v1/pages/${pageId}?${query}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(resp);
  } catch (error) {
    console.log(error);
  }
};
