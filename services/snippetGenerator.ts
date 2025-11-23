export const generateShopifySnippet = (videoUrl: string, productId: string) => {
  return `<!-- Shopify 360 Spin Snippet -->
<div class="product-360-container" style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">
  <video
    muted
    preload="auto"
    playsinline
    loop
    poster=""
    class="video360"
    id="spin-video-${productId}"
    style="width: 100%; border-radius: 12px; display: block; cursor: crosshair;"
  >
    <source src="${videoUrl}" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
  <div class="spin-indicator" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none;">
    360° View
  </div>
</div>

<script>
  (function() {
    const vid = document.getElementById('spin-video-${productId}');
    if(vid) {
      vid.addEventListener('mouseenter', () => {
        vid.currentTime = 0; 
        vid.play().catch(e => console.log('Autoplay prevented', e));
      });
      vid.addEventListener('mouseleave', () => {
        vid.pause();
        vid.currentTime = 0;
      });
      // Touch support for mobile
      vid.addEventListener('touchstart', () => vid.play());
      vid.addEventListener('touchend', () => vid.pause());
    }
  })();
</script>`;
};

export const generateTiendaNubeSnippet = (videoUrl: string) => {
  return `<!-- Tienda Nube / Nuvemshop Snippet -->
{% if product.metafields.spin_video_url %}
  <div class="cloud-360-viewer">
    <video src="${videoUrl}" muted playsinline loop class="w-100 rounded"></video>
  </div>
{% endif %}

<!-- Add this URL to your product metafields: -->
<!-- Key: spin_video_url -->
<!-- Value: ${videoUrl} -->`;
};

export const generateGenericEmbedSnippet = (videoUrl: string, productId: string) => {
  return `<!-- Generic 360 Spin Embed -->
<div style="width: 100%; max-width: 600px; margin: 0 auto;">
  <video
    controls
    autoplay
    muted
    loop
    playsinline
    src="${videoUrl}"
    id="generic-spin-video-${productId}"
    style="width: 100%; border-radius: 12px; display: block;"
  >
    Your browser does not support the video tag.
  </video>
</div>`;
};