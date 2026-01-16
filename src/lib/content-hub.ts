// src/lib/content-hub.ts

// Helper interface for the Token response
interface TokenResponse {
  access_token: string;
}

// 1. Authenticate with Content Hub
async function getCHToken(): Promise<string> {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.CH_CLIENT_ID!);
  params.append("client_secret", process.env.CH_CLIENT_SECRET!);

  const res = await fetch(`${process.env.CH_URL}/oauth/token`, {
    method: "POST",
    body: params,
    cache: "no-store", // Don't cache auth tokens
  });

  if (!res.ok)
    throw new Error(`Failed to get Content Hub Token: ${res.statusText}`);

  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

// 2. The Main Upload Function
export async function uploadAsset(base64Image: string, fileName: string) {
  const token = await getCHToken();
  const buffer = Buffer.from(base64Image, "base64");

  // A. Initiate Upload (Ask CH for permission)
  const initRes = await fetch(`${process.env.CH_URL}/api/v2.0/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_name: fileName,
      file_size: buffer.length,
      upload_configuration: { name: "AssetUploadConfiguration" },
      action: { name: "NewAsset" }, // Creates a new asset entity
    }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Upload Init Failed: ${errText}`);
  }

  const initData = await initRes.json();

  // B. Upload the actual bits (Binary Upload)
  // We post the buffer to the temporary upload_url provided by step A
  if (initData.upload_url) {
    const uploadRes = await fetch(initData.upload_url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Sitecore usually expects multipart or raw binary depending on config.
        // For standard V2 uploads, usually just the body with correct headers works.
        "Content-Type": "multipart/form-data",
      },
      body: buffer,
    });

    if (!uploadRes.ok) throw new Error("Binary upload failed");
  }

  // C. Finalize (Tell CH we are done)
  const finalizeRes = await fetch(
    `${process.env.CH_URL}/api/v2.0/upload/finalize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upload_identifier: initData.upload_identifier,
        file_identifier: initData.file_identifier,
      }),
    }
  );

  if (!finalizeRes.ok) throw new Error("Finalize failed");

  const finalData = await finalizeRes.json();
  return finalData.asset_id; // Success! Returns the new Asset ID (e.g., 12345)
}
