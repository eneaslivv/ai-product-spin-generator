import React, { useState, useEffect, useRef } from 'react';
import { ProductData } from '../types';
import { generateShopifySnippet, generateTiendaNubeSnippet, generateGenericEmbedSnippet } from '../services/snippetGenerator';
import { CopyIcon, CheckIcon } from './Icons';

interface ResultViewProps {
  data: ProductData;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'shopify' | 'nube' | 'generic'>('shopify');
  const [copied, setCopied] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((e) => {
              console.log('Autoplay prevented by browser policy', e);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [data.videoUrl]);

  if (!data.videoUrl) return null;

  const shopifySnippet = generateShopifySnippet(data.videoUrl, data.id);
  const nubeSnippet = generateTiendaNubeSnippet(data.videoUrl);
  const genericSnippet = generateGenericEmbedSnippet(data.videoUrl, data.id);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getSnippetToCopy = () => {
    switch (activeTab) {
      case 'shopify':
        return shopifySnippet;
      case 'nube':
        return nubeSnippet;
      case 'generic':
        return genericSnippet;
      default:
        return '';
    }
  };

  const getInstallationGuide = () => {
    switch (activeTab) {
      case 'shopify':
        return "Navigate to your Online Store > Themes > Edit Code. Paste this snippet into a Custom HTML section or directly into your product template.";
      case 'nube':
        return "First, add the video URL to your product metafields (Key: spin_video_url). Then, paste the HTML code into your product description or template.";
      case 'generic':
        return "Paste this HTML snippet directly into the HTML editor of any webpage or content management system where you want the video to appear.";
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-4 animate-slide-up">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Left: Preview */}
        <div className="w-full lg:w-5/12 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Final Result</h3>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Ready
                </span>
             </div>
            <div className="rounded-xl overflow-hidden relative aspect-square bg-gray-50 flex items-center justify-center border border-gray-100">
                <video 
                ref={videoRef}
                src={data.videoUrl} 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-contain mix-blend-multiply"
                />
            </div>
            <div className="mt-5 text-center">
                <div className="text-base font-semibold text-gray-900">{data.name}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <a 
               href={data.videoUrl} 
               download={`${data.name}-360.mp4`}
               target="_blank"
               rel="noreferrer"
               className="flex items-center justify-center px-4 py-3.5 bg-white border border-gray-200 text-gray-900 hover:border-black rounded-xl text-sm font-semibold transition-all"
             >
               Download MP4
             </a>
             <button 
               onClick={onReset}
               className="flex items-center justify-center px-4 py-3.5 bg-black text-white hover:bg-gray-800 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-gray-200"
             >
               Create New
             </button>
          </div>
        </div>

        {/* Right: Code Snippets */}
        <div className="w-full lg:w-7/12 flex flex-col pt-2">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Embed Code</h2>
            <p className="text-sm text-gray-500">Copy the snippet below to your e-commerce platform.</p>
          </div>

          <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
            <button
              onClick={() => setActiveTab('shopify')}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === 'shopify' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Shopify
              {activeTab === 'shopify' && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black"></span>}
            </button>
            <button
              onClick={() => setActiveTab('nube')}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === 'nube' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Tienda Nube
              {activeTab === 'nube' && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black"></span>}
            </button>
            <button
              onClick={() => setActiveTab('generic')}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === 'generic' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Generic Embed
              {activeTab === 'generic' && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black"></span>}
            </button>
          </div>

          <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-200/60 overflow-hidden flex flex-col relative group hover:border-gray-300 transition-colors">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => handleCopy(getSnippetToCopy(), activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold border transition-all ${
                    copied === activeTab 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-black hover:text-black'
                }`}
              >
                {copied === activeTab ? <CheckIcon /> : <CopyIcon />}
                {copied === activeTab ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[350px] p-6">
                <code className="text-xs font-mono text-gray-600 leading-relaxed block whitespace-pre-wrap">
                {getSnippetToCopy()}
                </code>
            </div>
          </div>
          
          <div className="mt-6 p-5 bg-blue-50/30 rounded-xl border border-blue-100">
             <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">Installation Guide</h4>
             <p className="text-sm text-blue-800/80 leading-relaxed font-light">
               {getInstallationGuide()}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;