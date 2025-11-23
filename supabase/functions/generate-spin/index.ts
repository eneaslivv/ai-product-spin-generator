// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import fal from "https://esm.sh/@fal-ai/serverless-client"; // Cambiado a importación por defecto

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'generate-spin' received a request.");

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      product_id, 
      original_image_url, 
      original_back_image_url, 
      product_name, 
      user_id,
      google_api_key,
      fal_key,
    } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const googleAi = new GoogleGenAI({ apiKey: google_api_key });
    fal.config({ credentials: fal_key });

    const imageUrlToBase64 = async (url: string) => {
      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error(`Failed to fetch image from ${url}: ${imgRes.statusText}`);
      const imgBlob = await imgRes.blob();
      const arrayBuffer = await imgBlob.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return { base64: base64Image, mimeType: imgBlob.type };
    };

    const uploadBase64ToSupabase = async (base64Data: string, mimeType: string, userId: string, productId: string, type: string) => {
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileName = `${userId}/enhanced/${productId}-${type}-${Date.now()}.png`;

      const { data, error } = await supabase.storage
        .from('product-spins')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Supabase Storage upload failed for enhanced image: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-spins')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for enhanced image.');
      }
      return publicUrlData.publicUrl;
    };

    const { base64: originalFrontBase64, mimeType: frontMimeType } = await imageUrlToBase64(original_image_url);
    const enhancePrompt = `You are an expert e-commerce photo editor. I will provide an image of a product called "${product_name}". Your task: 1. Identify the main product subject. 2. Generate a new version of this image where the product is perfectly centered. 3. The background must be pure white (hex #FFFFFF). 4. Remove any harsh shadows, dust, or noise. 5. Enhance sharpness and lighting to look like professional studio photography. 6. Maintain the exact geometry and perspective of the original product. Do not hallucinate new features.`;
    
    const genAiResponseFront = await googleAi.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ inlineData: { mimeType: frontMimeType, data: originalFrontBase64 } }, { text: enhancePrompt }]
    });

    const enhancedFrontPart = genAiResponseFront.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!enhancedFrontPart) throw new Error("Front image enhancement failed: No inlineData found.");
    const enhancedFrontBase64 = enhancedFrontPart.inlineData.data;
    const enhancedFrontImageUrl = await uploadBase64ToSupabase(enhancedFrontBase64, 'image/png', user_id, product_id, 'front');

    let enhancedBackImageUrl: string | null = null;
    if (original_back_image_url) {
      const { base64: originalBackBase64, mimeType: backMimeType } = await imageUrlToBase64(original_back_image_url);
      const genAiResponseBack = await googleAi.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ inlineData: { mimeType: backMimeType, data: originalBackBase64 } }, { text: enhancePrompt }]
      });
      const enhancedBackPart = genAiResponseBack.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!enhancedBackPart) throw new Error("Back image enhancement failed: No inlineData found.");
      const enhancedBackBase64 = enhancedBackPart.inlineData.data;
      enhancedBackImageUrl = await uploadBase64ToSupabase(enhancedBackBase64, 'image/png', user_id, product_id, 'back');
    }

    const falResult = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: enhancedFrontImageUrl,
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

    const { data, error } = await supabase
      .from('products')
      .upsert({
          id: product_id,
          user_id: user_id, 
          name: product_name,
          originalimageurl: original_image_url,
          enhancedimageurl: enhancedFrontImageUrl,
          enhancedbackimageurl: enhancedBackImageUrl,
          videourl: videoUrl,
          timestamp: Date.now(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});