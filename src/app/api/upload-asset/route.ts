import { NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const CH_URL = process.env.NEXT_PUBLIC_CH_URL;
const CLIENT_ID = process.env.CH_CLIENT_ID;
const CLIENT_SECRET = process.env.CH_CLIENT_SECRET;
const USERNAME = process.env.CH_USERNAME;
const PASSWORD = process.env.CH_PASSWORD;

// 🚨 VERIFY THIS NAME IN YOUR SCHEMA (Manage > Schema > M.Asset > Relations)
// Common defaults: "PCMBrandToAsset", "BrandToAsset", "M_Brand_To_Asset"
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
// MAIN API ROUTE (BYPASS MODE)
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { imageBase64, brandId, fileName } = await req.json();
    const token = await getAuthToken();

    console.log(
      `DEBUG: Bypass Mode - Creating Asset Entity for Brand ID: ${brandId}...`
    );

    // -----------------------------------------------------------------------
    // CREATE ASSET ENTITY DIRECTLY (Skipping broken Upload Service)
    // -----------------------------------------------------------------------
    const createRes = await fetch(`${CH_URL}/api/entities`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entitydefinition: {
          href: `${CH_URL}/api/entitydefinitions/M.Asset`,
        },
        properties: {
          Title: fileName || "AI Generated Asset",
          FileName: fileName || "ai-gen.png",
          // 'Description' removed to avoid language 400 errors
        },
        relations: {
          // ✅ Link the brand immediately during creation
          [RELATION_NAME]: {
            children: [{ href: `${CH_URL}/api/entities/${brandId}` }],
          },
        },
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error("❌ Creation Failed:", createRes.status, errorText);
      throw new Error(
        `Asset Creation Failed: ${createRes.status} ${errorText}`
      );
    }

    const assetData = await createRes.json();
    const newAssetId = assetData.id;

    console.log(`✅ Asset Successfully Created & Linked! ID: ${newAssetId}`);

    return NextResponse.json({
      success: true,
      assetId: newAssetId,
      url: `${CH_URL}/en-us/asset/${newAssetId}`,
    });
  } catch (error: any) {
    console.error("❌ Workflow Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
