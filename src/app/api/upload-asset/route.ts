import { NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const CH_URL = process.env.NEXT_PUBLIC_CH_URL;
const CLIENT_ID = process.env.CH_CLIENT_ID;
const CLIENT_SECRET = process.env.CH_CLIENT_SECRET;
const USERNAME = process.env.CH_USERNAME;
const PASSWORD = process.env.CH_PASSWORD;

const CONFIG_NAME = "AssetUploadConfiguration";
const RELATION_NAME = "PCMBrandToAsset";

// -----------------------------------------------------------------------------
// HELPER: GET AUTH TOKEN
// -----------------------------------------------------------------------------
async function getAuthToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", USERNAME!);
  params.append("password", PASSWORD!);
  params.append("client_id", CLIENT_ID!);
  params.append("client_secret", CLIENT_SECRET!);

  const res = await fetch(`${CH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) throw new Error(`Auth Failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// -----------------------------------------------------------------------------
// HELPER: FALLBACK (METADATA ONLY)
// -----------------------------------------------------------------------------
async function createFallbackAsset(
  token: string,
  fileName: string,
  brandId: string
) {
  console.log(" Fallback: Creating Asset Metadata (No File)...");

  const createRes = await fetch(`${CH_URL}/api/entities`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entitydefinition: { href: `${CH_URL}/api/entitydefinitions/M.Asset` },
      properties: {
        Title: fileName || "AI Generated Asset",
        FileName: fileName || "ai-gen.png",
      },
      relations: {
        [RELATION_NAME]: {
          children: [{ href: `${CH_URL}/api/entities/${brandId}` }],
        },
      },
    }),
  });

  if (!createRes.ok)
    throw new Error(`Fallback Failed: ${await createRes.text()}`);
  return (await createRes.json()).id;
}

// -----------------------------------------------------------------------------
// MAIN API ROUTE
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  let token = "";
  let payload;

  try {
    payload = await req.json();
    const { imageBase64, brandId, fileName } = payload;
    token = await getAuthToken();

    // -------------------------------------------------------------------------
    // ATTEMPT 1: REAL UPLOAD (Using YOUR Fixed Config)
    // -------------------------------------------------------------------------
    try {
      console.log(` Attempting Real Upload using '${CONFIG_NAME}'...`);

      const cleanFileName = (fileName || `ai-gen.png`).replace(/\s+/g, "-");
      const parts = imageBase64.split(",");
      const rawBase64 = parts.length > 1 ? parts[1] : parts[0];
      const fileBuffer = Buffer.from(rawBase64, "base64");

      // 1. INIT UPLOAD
      const initRes = await fetch(`${CH_URL}/api/v2.0/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: cleanFileName,
          file_size: fileBuffer.length,
          upload_configuration: { name: CONFIG_NAME },
        }),
      });

      if (!initRes.ok) {
        const errTxt = await initRes.text();
        throw new Error(`Init Failed (${initRes.status}): ${errTxt}`);
      }

      const uploadConfig = await initRes.json();
      console.log(" Init Success! Got Azure URL.");

      // 2. UPLOAD TO AZURE
      await fetch(uploadConfig.upload_url, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Length": fileBuffer.length.toString(),
        },
        body: fileBuffer,
      });
      console.log(" Azure Upload Success!");

      // 3. FINALIZE
      const finalizeRes = await fetch(`${CH_URL}/api/v2.0/upload/finalize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upload_identifier: uploadConfig.upload_identifier,
          file_identifier: uploadConfig.file_identifier,
          upload_configuration: { name: CONFIG_NAME },
        }),
      });

      if (!finalizeRes.ok) throw new Error("Finalize Failed");
      const assetData = await finalizeRes.json();

      // 4. LINK BRAND
      if (brandId) {
        await fetch(`${CH_URL}/api/entities/${assetData.asset_id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            relations: {
              [RELATION_NAME]: {
                children: [{ href: `${CH_URL}/api/entities/${brandId}` }],
              },
            },
          }),
        });
      }

      return NextResponse.json({
        success: true,
        assetId: assetData.asset_id,
        url: `${CH_URL}/en-us/asset/${assetData.asset_id}`,
        method: "Real Upload",
      });
    } catch (realUploadError: any) {
      console.error(" Real Upload Error:", realUploadError.message);

      // ---------------------------------------------------------------------
      // FALLBACK: Metadata Only
      // ---------------------------------------------------------------------
      const fallbackId = await createFallbackAsset(
        token,
        payload.fileName,
        brandId
      );

      return NextResponse.json({
        success: true,
        assetId: fallbackId,
        url: `${CH_URL}/en-us/asset/${fallbackId}`,
        method: "Fallback (Metadata)",
        note: "Upload failed, but Asset Record created successfully.",
      });
    }
  } catch (fatalError: any) {
    console.error(" Fatal Error:", fatalError);
    return NextResponse.json(
      { success: false, error: fatalError.message },
      { status: 500 }
    );
  }
}
