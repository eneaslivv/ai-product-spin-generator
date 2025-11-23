import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useSession } from '../components/SessionContextProvider';
import { ProductData } from '../../types'; // Ruta corregida
import { Rotate3dIcon } from '../../components/Icons'; // Ruta corregida

interface DashboardViewProps {
  onViewProduct: (product: ProductData) => void;
  onNavigateToCreate: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onViewProduct, onNavigateToCreate }) => {
  const { user } = useSession();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) {
        setError('User not logged in.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load your creations.');
      } else {
        setProducts(data as ProductData[]);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-white">
        <div className="spin-loader !w-10 !h-10 !border-l-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in pt-10">
        <div className="bg-red-50 text-red-900 p-8 rounded-2xl border border-red-100 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Error</h3>
          <p className="text-sm opacity-80 leading-relaxed">{error}</p>
        </div>
        <button onClick={onNavigateToCreate} className="text-sm font-semibold text-gray-900 border-b border-gray-200 hover:border-gray-900 transition-all pb-0.5">
          Try Creating One
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto pt-4 animate-slide-up">
      <div className="space-y-2 mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Mis Creaciones
        </h1>
        <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed font-light">
          Aquí puedes ver y gestionar todos los videos 360° que has generado.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Rotate3dIcon size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Aún no tienes creaciones</h3>
          <p className="text-sm text-gray-500">
            ¡Empieza a generar tus primeros videos 360° de productos ahora mismo!
          </p>
          <button 
            onClick={onNavigateToCreate}
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-gray-200"
          >
            Crear mi primer Spin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              onClick={() => onViewProduct(product)}
            >
              <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {product.enhancedImageUrl && (
                  <img 
                    src={product.enhancedImageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                  />
                )}
                {product.videoUrl && (
                  <video 
                    src={product.videoUrl} 
                    muted 
                    loop 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Rotate3dIcon className="text-white w-10 h-10" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(product.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardView;