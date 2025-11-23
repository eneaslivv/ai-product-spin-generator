import fal from "@fal-ai/serverless-client"; // Corregido a importación por defecto
import { FalResponse } from "../types"; // Importar la interfaz FalResponse

export const generate360Spin = async (
  apiKey: string,
  imageUrl: string,
  productName: string
): Promise<string> => {
  if (!apiKey) throw new Error("FAL.ai Key is required");

  fal.config({
    credentials: apiKey,
  });

  try {
    console.log("Iniciando generación de video con Kling v2.5...");

    const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt: `A professional 360-degree orbiting camera shot of ${productName}, smooth turntable rotation, studio lighting, solid background, high resolution, 4k, cinematic focus, keeping the object shape consistent without deformation.`,
        duration: "5",
        aspect_ratio: "1:1"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Progreso FAL.ai: ${update.logs.map(log => log.message).join(' ')}`);
        }
      },
    }) as FalResponse;

    if (!result || !result.video || !result.video.url) {
      throw new Error("FAL.ai did not return a video URL.");
    }

    console.log("Video generado:", result.video.url);
    return result.video.url;

  } catch (error: any) {
    console.error("FAL Service Error:", error);
    throw new Error(error.message || "Failed to generate 360 spin with FAL.ai");
  }
};