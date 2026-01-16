import { NextResponse } from "next/server";
import { generateImage } from "@/src/lib/google-ai";

export async function POST(req: Request) {
  try {
    const { brandName, productDescription } = await req.json();

    // 1. Call Google AI
    const imageResult = await generateImage(productDescription, brandName);

    let imagePreviewUrl = "";

    // 2. Convert to Base64 for Frontend Display
    if (typeof imageResult === "string") {
      imagePreviewUrl = imageResult.startsWith("data:")
        ? imageResult
        : `data:image/png;base64,${imageResult}`;
    } else {
      // @ts-ignore
      const base64String = Buffer.from(imageResult).toString("base64");
      imagePreviewUrl = `data:image/png;base64,${base64String}`;
    }

    return NextResponse.json({
      success: true,
      assetId: `asset-${Date.now()}`,
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
