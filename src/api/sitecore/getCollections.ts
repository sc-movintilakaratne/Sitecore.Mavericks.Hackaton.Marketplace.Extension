import axiosClient from "@/src/config/axiosClient";
import { getCollectionsType } from "@/src/types/types";

export const getCollections = async ({
  token,
}: getCollectionsType) => {
  const query = new URLSearchParams({
    environmentId: "dev",
    pageNumber: "1",
    pageSize: "50",
  }).toString();
  try {
    const resp = await axiosClient.get(
      `https://xmapps-api.sitecorecloud.io/api/v1/collections?${query}`,
      {
        method: "GET",
        headers: {
          "x-sc-continuation": "string",
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
