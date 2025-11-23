import React, { useState, useEffect } from 'react';
import { AppState, ProductData, ApiKeys, ProcessingStep } from './types';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import UploadView from './components/UploadView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import DashboardView from './src/components/DashboardView';
import Login from './src/pages/Login';
import { useSession } from './src/components/SessionContextProvider';
import { supabase } from './src/integrations/supabase/client';
import { uploadImageToSupabase } from './src/integrations/supabase/storage';

const App: React.FC = () => {
  const { session, user, isLoading: isSessionLoading } = useSession();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard' | 'processing' | 'result' | 'error'>('upload');
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
    user_id: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(true);

  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Uploading Images', status: 'pending' },
    { id: 'enhance', label: 'AI Image Enhancement', status: 'pending' },
    { id: 'spin', label: '360° Geometry Generation', status: 'pending' },
    { id: 'save', label: 'Saving Product Data', status: 'pending' },
  ]);

  const updateStepStatus = (id: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status } : step
    ));
  };

  useEffect(() => {
    const fetchApiKeys = async () => {
      setIsApiKeysLoading(true);

      // Default values for Supabase keys from environment variables (still needed client-side)
      const defaultSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const defaultSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      let currentGoogleApiKey = ''; // No longer from VITE_ env
      let currentFalKey = '';       // No longer from VITE_ env
      let currentSupabaseUrl = defaultSupabaseUrl;
      let currentSupabaseAnonKey = defaultSupabaseAnonKey;

      if (user) {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching API keys:', error);
          setErrorMsg('Failed to load API keys.');
        } else if (data) {
          currentGoogleApiKey = data.google_api_key || '';
          currentFalKey = data.fal_key || '';
          currentSupabaseUrl = data.supabase_url || defaultSupabaseUrl;
          currentSupabaseAnonKey = data.supabase_anon_key || defaultSupabaseAnonKey;
        }
      }

      setApiKeys({
        googleApiKey: currentGoogleApiKey,
        falKey: currentFalKey,
        supabaseUrl: currentSupabaseUrl,
        supabaseAnonKey: currentSupabaseAnonKey
      });
      setIsApiKeysLoading(false);
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

    const newProductId = crypto.randomUUID();

    setAppState(AppState.UPLOADING);
    setCurrentView('processing');
    setErrorMsg(null);
    setProductData({
      id: newProductId,
      name,
      originalImageBlob: frontFile,
      originalBackImageBlob: backFile,
      originalImageUrl: null,
      enhancedImageUrl: null,
      enhancedBackImageUrl: null,
      videoUrl: null,
      timestamp: 0,
      user_id: user.id,
    });

    setProcessingSteps([
        { id: 'upload', label: 'Uploading Images', status: 'loading' },
        { id: 'enhance', label: 'AI Image Enhancement', status: 'pending' },
        { id: 'spin', label: '360° Geometry Generation', status: 'pending' },
        { id: 'save', label: 'Saving Product Data', status: 'pending' },
    ]);

    try {
      const frontImageUrl = await uploadImageToSupabase(frontFile, user.id, 'original');
      let backImageUrl: string | null = null;
      if (backFile) {
        backImageUrl = await uploadImageToSupabase(backFile, user.id, 'original-back');
      }

      setProductData(prev => ({ 
          ...prev, 
          originalImageUrl: frontImageUrl,
          originalBackImageUrl: backImageUrl
      }));
      updateStepStatus('upload', 'success');

      setAppState(AppState.ENHANCING);
      updateStepStatus('enhance', 'loading');

      const { data, error: edgeFunctionError } = await supabase.functions.invoke('generate-spin', {
        body: JSON.stringify({
          product_id: newProductId,
          original_image_url: frontImageUrl,
          original_back_image_url: backImageUrl,
          product_name: name,
          // user_id is no longer passed in the body, it's derived from the JWT in the Edge Function
        }),
      });

      if (edgeFunctionError) {
        throw new Error(`Edge Function error: ${edgeFunctionError.message}`);
      }
      if (!data || data.error) {
        throw new Error(`Edge Function returned an error: ${data?.error || 'Unknown error'}`);
      }

      setProductData(prev => ({ 
          ...prev, 
          enhancedImageUrl: data.enhancedimageurl,
          enhancedBackImageUrl: data.enhancedbackimageurl,
          videoUrl: data.videourl,
      }));
      updateStepStatus('enhance', 'success');
      updateStepStatus('spin', 'success');
      updateStepStatus('save', 'success');

      setAppState(AppState.COMPLETE);
      setCurrentView('result');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred");
      setAppState(AppState.ERROR);
      setCurrentView('error');
      setProcessingSteps(prev => {
          const loadingStep = prev.find(p => p.status === 'loading');
          if(loadingStep) return prev.map(p => p.id === loadingStep.id ? {...p, status: 'error'} : p);
          return prev;
      });
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setCurrentView('upload');
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

  const handleViewProductFromDashboard = (product: ProductData) => {
    console.log("Product clicked from dashboard:", product); // Línea añadida para depuración
    setProductData(product);
    setAppState(AppState.COMPLETE);
    setCurrentView('result');
  };

  useEffect(() => {
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
      <Header 
        onOpenSettings={() => setShowSettings(true)} 
        onNavigateToDashboard={() => setCurrentView('dashboard')}
        onNavigateToCreate={() => setCurrentView('upload')}
        currentView={currentView}
      />
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {currentView === 'upload' && (
          <UploadView 
            onStart={handleStart} 
            isConfigured={!!apiKeys.googleApiKey && !!apiKeys.falKey} 
          />
        )}

        {currentView === 'processing' && (
          <ProcessingView 
            steps={processingSteps} 
            previewImage={productData.enhancedImageUrl || productData.originalImageUrl}
            isEnhanced={!!productData.enhancedImageUrl}
          />
        )}

        {currentView === 'result' && (
          <ResultView data={productData} onReset={reset} />
        )}

        {currentView === 'dashboard' && (
          <DashboardView 
            onViewProduct={handleViewProductFromDashboard} 
            onNavigateToCreate={() => setCurrentView('upload')}
          />
        )}

        {currentView === 'error' && (
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