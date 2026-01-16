export const envConfig = {
  sitecore: {
    clientId: process.env.NEXT_PUBLIC_SITECORE_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_SITECORE_CLIENT_SECRET || "",
    environmentId: process.env.NEXT_PUBLIC_SITECORE_ENVIRONMENT_ID || "",
  },
};