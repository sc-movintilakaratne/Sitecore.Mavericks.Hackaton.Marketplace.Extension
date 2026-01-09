import axiosClient from "@/src/config/axiosClient";
import { envConfig } from "@/src/config/envConfig";
import { getSitesType } from "@/src/types/types";

export const getSites = async ({
  token,
  collectionId,
}: getSitesType) => {
  const query = new URLSearchParams({environmentId: `${envConfig.sitecore.environmentId}`}).toString();
  try {
    const url = collectionId
      ? `https://xmapps-api.sitecorecloud.io/api/v1/collections/${collectionId}/sites?${query}`
      : `https://edge-platform.sitecorecloud.io/stream/ai-agent-api/api/v1/sites`;
    
    const resp = await axiosClient.get(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(resp.data);
    return resp.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
