// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "https://esm.sh/@google/genai";

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
    // Note: Deno/Edge environment usage of @google/genai might differ slightly in import
    // Assuming standard model usage
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

    // 3. Generate 360 Spin with FAL.ai
    const falResponse = await fetch("https://queue.fal.run/fal-ai/3d-photo-spin", {
        method: "POST",
        headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image_url: enhancedImageUrl,
            spin_degrees: 360,
            duration: 2.5,
            quality: "high"
        })
    });

    if(!falResponse.ok) throw new Error("FAL Init failed");
    const falInit = await falResponse.json();
    
    // Poll FAL (Simplified synchronous wait for demo purposes - ideally use webhooks)
    let videoUrl = "";
    let status = "IN_PROGRESS";
    while(status !== "COMPLETED" && status !== "FAILED") {
        await new Promise(r => setTimeout(r, 2000));
        const check = await fetch(`https://queue.fal.run/fal-ai/3d-photo-spin/requests/${falInit.request_id}`, {
             headers: { "Authorization": `Key ${falKey}` }
        });
        const checkData = await check.json();
        status = checkData.status;
        if(status === "COMPLETED") videoUrl = checkData.video.url;
        if(status === "FAILED") throw new Error("FAL Generation Failed");
    }

    // 4. Upload Result to Supabase (Optional: Download videoUrl and upload to own bucket)
    // For now, we save the external URL to DB
    
    // 5. Save to DB
    const { data, error } = await supabase
      .from('product_spin_videos')
      .insert([
        { 
            user_id: user_id, 
            product_name: product_name,
            original_image_url: image_url,
            enhanced_image_url: "stored_in_bucket_path...", // Ideally upload the base64
            video_url: videoUrl
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