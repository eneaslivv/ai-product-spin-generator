import { GoogleGenAI } from "@google/genai";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const enhanceImage = async (
  apiKey: string,
  imageBlob: Blob,
  productName: string
): Promise<string> => {
  if (!apiKey) throw new Error("Google API Key is required");

  const ai = new GoogleGenAI({ apiKey });
  const base64Image = await blobToBase64(imageBlob);

  // We use gemini-2.5-flash-image for image operations
  const model = "gemini-2.5-flash-image";

  // Prompt engineered for e-commerce enhancement
  const prompt = `
    You are an expert e-commerce photo editor. 
    I will provide an image of a product called "${productName}".
    
    Your task:
    1. Identify the main product subject.
    2. Generate a new version of this image where the product is perfectly centered.
    3. The background must be pure white (hex #FFFFFF).
    4. Remove any harsh shadows, dust, or noise.
    5. Enhance sharpness and lighting to look like professional studio photography.
    6. Maintain the exact geometry and perspective of the original product. Do not hallucinate new features.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageBlob.type || "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
    });

    // Extract the image from the response
    // Usually, Gemini returns the image in the parts
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) throw new Error("No content generated");

    let enhancedImageBase64 = "";

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        enhancedImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!enhancedImageBase64) {
        // If text was returned instead of an image (error description), throw it
       const textPart = parts.find(p => p.text);
       if(textPart) throw new Error(`Model returned text instead of image: ${textPart.text}`);
       throw new Error("Failed to generate enhanced image.");
    }

    return `data:image/png;base64,${enhancedImageBase64}`;

  } catch (error: any) {
    console.error("Google AI Enhancement Error:", error);
    throw new Error(error.message || "Failed to enhance image with Google AI");
  }
};