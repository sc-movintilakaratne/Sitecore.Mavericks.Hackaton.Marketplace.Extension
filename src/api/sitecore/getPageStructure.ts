import axiosClient from "@/src/config/axiosClient";
import { getPageStructureType } from "@/src/types/types";

export const getPageStructure = async ({
  token,
  pageId
}: getPageStructureType) => {
    const query = new URLSearchParams({
    language: 'en',
    version: '1'
  }).toString();
  try {
    const resp = await axiosClient.get(
    `https://edge-platform.sitecorecloud.io/stream/ai-agent-api/api/v1/pages/${pageId}/html?${query}`,
    {
      method: 'GET',
      headers: {
        'x-sc-job-id': 'job-1234',
        Authorization: `Bearer ${token}`
      }
    }
  );
    console.log(resp.data);
    return resp.data;
  } catch (error) {
    console.log(error);
  }
};
