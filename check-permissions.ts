// check-permissions.ts
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkModels() {
  console.log("------------------------------------------------");
  console.log("Checking API Key permissions...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY not found in .env.local");
    return;
  }
  console.log(
    "Key found (Ends in ... " + process.env.GEMINI_API_KEY.slice(-4) + ")"
  );
  console.log("------------------------------------------------");

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    console.log("Fetching model list (this may take a moment)...");

    // The list() method returns a Pager (an async iterable), not an array
    const response = await genAI.models.list();

    let foundImageModel = false;

    console.log("\nMODELS AVAILABLE TO YOU:");

    // We iterate through the Pager directly
    for await (const model of response) {
      // Check for 'gemini' or 'imagen' models
      if (model.name?.includes("gemini") || model.name?.includes("imagen")) {
        console.log(`\n• Name: ${model.name}`);
        // Log supported methods if available, otherwise just the name
        // The new SDK sometimes hides methods in 'supportedActions' or similar
        console.log(
          `  Type: ${
            model.name.includes("flash") ? "Fast/Multimodal" : "Standard"
          }`
        );

        // Check for specific image generation models
        if (
          model.name?.includes("imagen") ||
          model.name === "gemini-2.0-flash-exp"
        ) {
          console.log("  ✅ THIS MODEL CAN GENERATE IMAGES!");
          foundImageModel = true;
        }
      }
    }

    console.log("\n------------------------------------------------");
    if (foundImageModel) {
      console.log(
        "RESULT: ✅ SUCCESS. You have access to image generation models."
      );
      console.log(
        "You can try using: 'gemini-2.0-flash-exp' or 'imagen-3.0-generate-001'"
      );
    } else {
      console.log(
        "RESULT: ❌ FAIL. No dedicated image generation models found."
      );
      console.log("Your API Key might be restricted to text-only models.");
    }
    console.log("------------------------------------------------");
  } catch (error: any) {
    console.error("\nCRITICAL ERROR:");
    console.error(`Message: ${error.message}`);

    if (
      error.message?.includes("403") ||
      error.message?.includes("API key not valid")
    ) {
      console.log(
        ">>> ACTION: Check if billing is enabled in Google Cloud Console."
      );
    }
  }
}

checkModels();
