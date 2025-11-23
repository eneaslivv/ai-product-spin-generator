// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { fal } from "https://esm.sh/@fal-ai/serverless-client"; // Importar fal-client para Deno

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_url, product_name, user_id } = await req.json();
    
    // Initialize Clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const googleAi = new GoogleGenAI({ apiKey: Deno.env.get('GOOGLE_API_KEY') });
    const falKey = Deno.env.get('FAL_KEY');

    // 1. Fetch Original Image
    const imgRes = await fetch(image_url);
    const imgBlob = await imgRes.blob();
    const arrayBuffer = await imgBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // 2. Enhance with Google AI
    const enhancePrompt = "Enhance this product photo for e-commerce. Center object, pure white background, remove shadows.";
    
    const genAiResponse = await googleAi.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
            parts: [
                { inlineData: { mimeType: imgBlob.type, data: base64Image } },
                { text: enhancePrompt }
            ]
        }
    });

    // Extract enhanced image (simplified logic)
    const enhancedPart = genAiResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!enhancedPart) throw new Error("Enhancement failed");
    
    const enhancedImageBase64 = enhancedPart.inlineData.data;
    const enhancedImageUrl = `data:image/png;base64,${enhancedImageBase64}`;

    // 3. Generate 360 Spin with FAL.ai (using fal-client)
    fal.config({
      credentials: falKey,
    });

    const falResult = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: enhancedImageUrl,
        prompt: `A professional 360-degree orbiting camera shot of ${product_name}, smooth turntable rotation, studio lighting, solid background, high resolution, 4k, cinematic focus, keeping the object shape consistent without deformation.`,
        duration: "5",
        aspect_ratio: "1:1"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Progreso FAL.ai (Edge Function): ${update.logs.map(log => log.message).join(' ')}`);
        }
      },
    });

    if (!falResult || !falResult.video || !falResult.video.url) {
      throw new Error("FAL.ai did not return a video URL from Edge Function.");
    }
    const videoUrl = falResult.video.url;

    // 4. Save to DB
    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
            user_id: user_id, 
            name: product_name, // Usar 'name' en lugar de 'product_name' para coincidir con la tabla
            originalimageurl: image_url,
            enhancedimageurl: enhancedImageUrl, // Guardar la URL base64 de la imagen mejorada
            videourl: videoUrl,
            timestamp: Date.now(), // Añadir timestamp
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});