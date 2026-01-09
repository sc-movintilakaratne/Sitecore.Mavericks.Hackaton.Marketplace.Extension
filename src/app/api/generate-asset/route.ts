// src/app/api/generate-asset/route.ts
import { NextResponse } from "next/server";
import { generateImage } from "@/src/lib/google-ai";
// import { uploadAsset } from "@/src/lib/content-hub";

export async function POST(req: Request) {
  try {
    const { brandName, productDescription } = await req.json();

    // 1. Call the AI (or Mock function)
    const imageResult = await generateImage(productDescription, brandName);

    let imagePreviewUrl = "";

    // 2. SMART CHECK: Handle the image data correctly
    if (typeof imageResult === "string") {
      // If it already has the prefix (like your Mock function), use it as is.
      if (imageResult.startsWith("data:")) {
        imagePreviewUrl = imageResult;
      } else {
        // If it's a raw base64 string without prefix, add it.
        imagePreviewUrl = `data:image/png;base64,${imageResult}`;
      }
    } else {
      // @ts-ignore - Buffer handling
      const base64String = Buffer.from(imageResult).toString("base64");
      imagePreviewUrl = `data:image/png;base64,${base64String}`;
    }

    return NextResponse.json({
      success: true,
      assetId: `asset-${Date.now()}`, // Temporary ID
      imagePreview: imagePreviewUrl,
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate asset" },
      { status: 500 }
    );
  }
}
