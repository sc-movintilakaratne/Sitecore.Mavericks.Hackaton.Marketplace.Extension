import axiosClient from "@/src/config/axiosClient";
import { getAllPagesBySiteTypes } from "@/src/types/types";

export const getAllPagesBySite = async ({token, siteName}: getAllPagesBySiteTypes) => {
  try {
    const resp = await axiosClient.get(
      `https://edge-platform.sitecorecloud.io/stream/ai-agent-api/api/v1/sites/${siteName}/pages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(resp.data);
    return resp.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
