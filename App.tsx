import React, { useState, useEffect } from 'react';
import { AppState, ProductData, ApiKeys, ProcessingStep } from './types';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import UploadView from './components/UploadView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import Login from './src/pages/Login'; // Ruta corregida
import { enhanceImage } from './services/googleAiService';
import { generate360Spin } from './services/falService';
import { useSession } from './src/components/SessionContextProvider'; // Ruta corregida
import { supabase } from './src/integrations/supabase/client'; // Ruta corregida

const App: React.FC = () => {
  const { session, user, isLoading: isSessionLoading } = useSession();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    googleApiKey: '',
    falKey: '',
    supabaseUrl: '',
    supabaseAnonKey: ''
  });
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
    user_id: '', // Added user_id
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(true);

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

  // Fetch API keys from Supabase when user session changes
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (user) {
        setIsApiKeysLoading(true);
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching API keys:', error);
          setErrorMsg('Failed to load API keys.');
          // Fallback to environment variables even on error
          setApiKeys({
            googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
            falKey: import.meta.env.VITE_FAL_KEY || '',
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
            supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          });
        } else if (data) {
          // Use user-specific keys if found
          setApiKeys({
            googleApiKey: data.google_api_key || '',
            falKey: data.fal_key || '',
            supabaseUrl: data.supabase_url || '',
            supabaseAnonKey: data.supabase_anon_key || ''
          });
        } else {
          // No user-specific keys found, use environment variables as defaults
          setApiKeys({
            googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
            falKey: import.meta.env.VITE_FAL_KEY || '',
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
            supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          });
        }
        setIsApiKeysLoading(false);
      } else {
        // No user logged in, use environment variables as defaults
        setApiKeys({
          googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
          falKey: import.meta.env.VITE_FAL_KEY || '',
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
          supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        });
        setIsApiKeysLoading(false);
      }
    };

    if (!isSessionLoading) {
      fetchApiKeys();
    }
  }, [user, isSessionLoading]);

  const saveKeys = async (keys: ApiKeys) => {
    if (!user) {
      setErrorMsg('You must be logged in to save API keys.');
      return;
    }

    const { error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: user.id,
        google_api_key: keys.googleApiKey,
        fal_key: keys.falKey,
        supabase_url: keys.supabaseUrl,
        supabase_anon_key: keys.supabaseAnonKey,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving API keys:', error);
      setErrorMsg('Failed to save API keys.');
    } else {
      setApiKeys(keys);
    }
  };

  const handleStart = async (frontFile: File, backFile: File | null, name: string) => {
    if (!user) {
      setErrorMsg('You must be logged in to generate product spins.');
      return;
    }

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
      user_id: user.id, // Associate with current user
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

      // 3. Save product data to Supabase
      setAppState(AppState.SAVING);
      updateStepStatus('save', 'loading');
      
      const { error: saveError } = await supabase
        .from('products')
        .insert({
          id: productData.id,
          name: productData.name,
          originalimageurl: productData.originalImageUrl,
          enhancedimageurl: enhancedFront,
          videourl: videoUrl,
          timestamp: productData.timestamp,
          user_id: user.id,
        });

      if (saveError) {
        throw new Error(`Failed to save product data: ${saveError.message}`);
      }
      
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
        user_id: user?.id || '',
    });
    setErrorMsg(null);
  };

  // Open settings immediately if no keys and not loading
  useEffect(() => {
      // Only show settings if user is logged in AND either Google AI or FAL key is missing
      // This check now considers both user-specific and default keys
      if (!isSessionLoading && !isApiKeysLoading && user && (!apiKeys.googleApiKey || !apiKeys.falKey)) {
          setShowSettings(true);
      }
  }, [apiKeys, user, isSessionLoading, isApiKeysLoading]);

  if (isSessionLoading || isApiKeysLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="spin-loader !w-10 !h-10 !border-l-black"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

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