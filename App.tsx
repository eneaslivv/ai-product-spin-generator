import React, { useState, useEffect } from 'react';
import { AppState, ProductData, ApiKeys, ProcessingStep } from './types';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import UploadView from './components/UploadView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import { enhanceImage } from './services/googleAiService';
import { generate360Spin } from './services/falService';

// Default keys from localStorage or empty
const getStoredKeys = (): ApiKeys => {
  const stored = localStorage.getItem('spin_gen_keys');
  return stored ? JSON.parse(stored) : {
    googleApiKey: '',
    falKey: '',
    supabaseUrl: '',
    supabaseAnonKey: ''
  };
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(getStoredKeys());
  const [showSettings, setShowSettings] = useState(false);
  const [productData, setProductData] = useState<ProductData>({
    id: '',
    name: '',
    originalImageBlob: null,
    originalBackImageBlob: null,
    originalImageUrl: null,
    enhancedImageUrl: null,
    enhancedBackImageUrl: null,
    videoUrl: null,
    timestamp: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Define steps for the processing view
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'enhance', label: 'AI Image Enhancement', status: 'pending' },
    { id: 'spin', label: '360° Geometry Generation', status: 'pending' },
    { id: 'save', label: 'Formatting Output', status: 'pending' },
  ]);

  const updateStepStatus = (id: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status } : step
    ));
  };

  const saveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('spin_gen_keys', JSON.stringify(keys));
  };

  const handleStart = async (frontFile: File, backFile: File | null, name: string) => {
    setAppState(AppState.UPLOADING);
    setErrorMsg(null);
    setProductData({
      id: crypto.randomUUID(),
      name,
      originalImageBlob: frontFile,
      originalBackImageBlob: backFile,
      originalImageUrl: URL.createObjectURL(frontFile),
      enhancedImageUrl: null,
      enhancedBackImageUrl: null,
      videoUrl: null,
      timestamp: Date.now(),
    });

    // Reset steps
    setProcessingSteps([
        { id: 'enhance', label: 'AI Image Enhancement', status: 'pending' },
        { id: 'spin', label: '360° Geometry Generation', status: 'pending' },
        { id: 'save', label: 'Formatting Output', status: 'pending' },
    ]);

    try {
      // 1. Enhance Images (Parallel if back exists)
      setAppState(AppState.ENHANCING);
      updateStepStatus('enhance', 'loading');
      
      const enhancePromises = [
        enhanceImage(apiKeys.googleApiKey, frontFile, name)
      ];

      if (backFile) {
        enhancePromises.push(enhanceImage(apiKeys.googleApiKey, backFile, `${name} (Back View)`));
      }

      const results = await Promise.all(enhancePromises);
      const enhancedFront = results[0];
      const enhancedBack = results.length > 1 ? results[1] : null;
      
      // Update data immediately so ProcessingView shows the enhanced image
      setProductData(prev => ({ 
          ...prev, 
          enhancedImageUrl: enhancedFront,
          enhancedBackImageUrl: enhancedBack
      }));
      updateStepStatus('enhance', 'success');

      // 2. Generate Spin
      setAppState(AppState.GENERATING_SPIN);
      updateStepStatus('spin', 'loading');

      const videoUrl = await generate360Spin(apiKeys.falKey, enhancedFront, enhancedBack);
      
      setProductData(prev => ({ ...prev, videoUrl }));
      updateStepStatus('spin', 'success');

      // 3. "Save" (Mocking Supabase storage for client-side demo)
      setAppState(AppState.SAVING);
      updateStepStatus('save', 'loading');
      
      await new Promise(r => setTimeout(r, 800)); // Short delay for UX
      
      updateStepStatus('save', 'success');
      setAppState(AppState.COMPLETE);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred");
      setAppState(AppState.ERROR);
      // Mark current loading step as error
      setProcessingSteps(prev => {
          const loadingStep = prev.find(p => p.status === 'loading');
          if(loadingStep) return prev.map(p => p.id === loadingStep.id ? {...p, status: 'error'} : p);
          return prev;
      });
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setProductData({
        id: '',
        name: '',
        originalImageBlob: null,
        originalBackImageBlob: null,
        originalImageUrl: null,
        enhancedImageUrl: null,
        enhancedBackImageUrl: null,
        videoUrl: null,
        timestamp: 0,
    });
  };

  // Open settings immediately if no keys
  useEffect(() => {
      if(!apiKeys.googleApiKey || !apiKeys.falKey) {
          setShowSettings(true);
      }
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <Header onOpenSettings={() => setShowSettings(true)} />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {appState === AppState.IDLE && (
          <UploadView 
            onStart={handleStart} 
            isConfigured={!!apiKeys.googleApiKey && !!apiKeys.falKey} 
          />
        )}

        {(appState === AppState.UPLOADING || 
          appState === AppState.ENHANCING || 
          appState === AppState.GENERATING_SPIN || 
          appState === AppState.SAVING) && (
          <ProcessingView 
            steps={processingSteps} 
            // Prefer showing the enhanced front image
            previewImage={productData.enhancedImageUrl || productData.originalImageUrl}
            isEnhanced={!!productData.enhancedImageUrl}
          />
        )}

        {appState === AppState.COMPLETE && (
          <ResultView data={productData} onReset={reset} />
        )}

        {appState === AppState.ERROR && (
           <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in pt-10">
              <div className="bg-red-50 text-red-900 p-8 rounded-2xl border border-red-100 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-2">System Error</h3>
                  <p className="text-sm opacity-80 leading-relaxed">{errorMsg}</p>
              </div>
              <button onClick={reset} className="text-sm font-semibold text-gray-900 border-b border-gray-200 hover:border-gray-900 transition-all pb-0.5">
                Try Again
              </button>
           </div>
        )}
      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        apiKeys={apiKeys}
        onSave={saveKeys}
      />
    </div>
  );
};

export default App;