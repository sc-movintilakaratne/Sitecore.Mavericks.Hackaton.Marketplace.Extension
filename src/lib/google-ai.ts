// src/lib/google-ai.ts
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateImage(prompt: string, brandStyle: string) {
  try {
    // 1. Use the model confirmed by your permission script
    const modelName = "imagen-4.0-generate-001";

    console.log(` Calling Google AI (Imagen 4) with prompt: "${prompt}"...`);

    const fullPrompt = `Professional product shot of ${prompt}. 
                        Style: ${brandStyle}. 
                        High resolution, 4k, studio lighting, photorealistic.`;

    // 2. Call the Image Generation API
    // Note: We use 'generateImages', not 'generateContent'
    const response = await genAI.models.generateImages({
      model: modelName,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        // aspect_ratio: "1:1" // Optional
      },
    });

    // 3. Extract the Image Data
    // The new SDK returns the image in 'generatedImages[0].image.imageBytes'
    const generatedImage = response.generatedImages?.[0];

    if (generatedImage?.image?.imageBytes) {
      // Return the raw binary data (Buffer)
      // Our API route will handle converting this to Base64 for the frontend
      return generatedImage.image.imageBytes;
    }

    console.error(
      "Unexpected Response Structure:",
      JSON.stringify(response, null, 2)
    );
    throw new Error("Google AI replied, but no image data was found.");
  } catch (error: any) {
    console.error(" Google AI Error:", error);

    // Provide a clear error if billing fails again (though it shouldn't now!)
    if (error.message?.includes("403") || error.message?.includes("Billing")) {
      throw new Error(
        "Billing permission denied. Double check your Project is linked to the Active Billing Account."
      );
    }
    throw error;
  }
}
