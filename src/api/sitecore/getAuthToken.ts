import axiosClient from "@/src/config/axiosClient";
import { envConfig } from "@/src/config/envConfig";
import { getAuthTokenTypes } from "@/src/types/types";

export const getAuthToken = async ({ setToken }: getAuthTokenTypes) => {
  const url = "https://auth.sitecorecloud.io/oauth/token";
  const data = new URLSearchParams({
    client_id: envConfig.sitecore.clientId,
    client_secret: envConfig.sitecore.clientSecret,
    grant_type: "client_credentials",
    audience: "https://api.sitecorecloud.io",
  });
  try {
    const response = await axiosClient.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*"
      },
    });

    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
};
