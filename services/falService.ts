
export const generate360Spin = async (
  apiKey: string,
  imageUrl: string,
  backImageUrl?: string | null
): Promise<string> => {
  if (!apiKey) throw new Error("FAL.ai Key is required");

  // In a real production app, this call should happen via a proxy or Edge Function
  // to avoid exposing the Secret Key. For this Generator Tool, we use it directly.
  
  try {
    const payload: any = {
      image_url: imageUrl,
      spin_degrees: 360,
      duration: 3.0, // 3 seconds for a smooth spin
      quality: "high"
    };

    // If back image is provided, pass it to the model 
    // (Note: Depends on specific model capability, standard spin models may ignore this, 
    // but we support the data flow for advanced models)
    if (backImageUrl) {
        payload.back_image_url = backImageUrl;
    }

    const response = await fetch("https://queue.fal.run/fal-ai/3d-photo-spin", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "FAL.ai request failed");
    }

    const initialData = await response.json();
    const requestId = initialData.request_id;
    
    // Poll for result
    const resultUrl = `https://queue.fal.run/fal-ai/3d-photo-spin/requests/${requestId}`;
    
    let attempts = 0;
    while (attempts < 30) { // Timeout after ~60s
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      
      const checkResponse = await fetch(resultUrl, {
         headers: { "Authorization": `Key ${apiKey}` }
      });
      
      const statusData = await checkResponse.json();
      
      if (statusData.status === "COMPLETED") {
        if (statusData.video && statusData.video.url) {
            return statusData.video.url;
        }
        // Fallback or error in structure
        console.error("FAL Response:", statusData);
        throw new Error("Video URL missing in completed response");
      }
      
      if (statusData.status === "FAILED") {
        throw new Error(statusData.error || "Generation failed on FAL.ai");
      }
      
      attempts++;
    }
    
    throw new Error("Generation timed out");

  } catch (error: any) {
    console.error("FAL Service Error:", error);
    throw error;
  }
};
