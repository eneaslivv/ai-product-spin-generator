import React, { useCallback, useState } from 'react';
import { UploadIcon, SparklesIcon, XIcon } from './Icons';

interface UploadViewProps {
  onStart: (frontFile: File, backFile: File | null, name: string) => void;
  isConfigured: boolean;
}

const UploadView: React.FC<UploadViewProps> = ({ onStart, isConfigured }) => {
  const [productName, setProductName] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  
  // Drag states
  const [dragFront, setDragFront] = useState(false);
  const [dragBack, setDragBack] = useState(false);

  const handleDrag = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDrag(true);
    } else if (e.type === "dragleave") {
      setDrag(false);
    }
  };

  const handleDrop = (e: React.DragEvent, setFile: (f: File) => void, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setFile(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = () => {
    if (frontFile && productName) {
      onStart(frontFile, backFile, productName);
    }
  };

  const renderUploadBox = (
    label: string, 
    subLabel: string, 
    file: File | null, 
    setFile: (f: File | null) => void,
    dragState: boolean,
    setDrag: (v: boolean) => void,
    id: string
  ) => (
    <div 
      className={`relative group cursor-pointer flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl border transition-all duration-300 ease-out overflow-hidden
        ${dragState ? 'border-black bg-gray-50 scale-[1.01]' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
        ${file ? 'border-solid border-gray-100 bg-white shadow-sm' : 'bg-white border-dashed'}
      `}
      onDragEnter={(e) => handleDrag(e, setDrag)}
      onDragLeave={(e) => handleDrag(e, setDrag)}
      onDragOver={(e) => handleDrag(e, setDrag)}
      onDrop={(e) => handleDrop(e, (f) => setFile(f), setDrag)}
      onClick={() => document.getElementById(id)?.click()}
    >
      <input 
        id={id} 
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
            if(e.target.files?.[0]) setFile(e.target.files[0]);
        }}
      />
      
      {file ? (
        <div className="relative w-full h-full p-6 flex flex-col items-center justify-center animate-fade-in">
           <img 
             src={URL.createObjectURL(file)} 
             alt="Preview" 
             className="w-full h-[85%] object-contain" 
           />
           <div className="absolute bottom-3 left-4 right-4 flex justify-center">
             <span className="bg-black/5 text-black/80 px-3 py-1 rounded-full text-[10px] font-medium truncate max-w-full">
               {file.name}
             </span>
           </div>
           
           <button 
             onClick={(e) => {
                 e.stopPropagation();
                 setFile(null);
             }}
             className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur border border-gray-100 rounded-full text-gray-500 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
           >
               <XIcon />
           </button>
        </div>
      ) : (
        <div className="text-center space-y-4 p-6 transition-transform duration-300 group-hover:scale-105">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-black group-hover:bg-gray-100 transition-colors">
            <UploadIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wide">{subLabel}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-slide-up pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Create 360° Spins
        </h1>
        <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed font-light">
          Upload product photos to generate professional rotating videos using AI.
        </p>
      </div>

      <div className="space-y-10">
        {/* Product Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider ml-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Eames Lounge Chair"
            className="w-full bg-transparent border-b border-gray-200 px-1 py-3 text-xl text-gray-900 placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors font-medium"
          />
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderUploadBox(
                "Front View", 
                "Required", 
                frontFile, 
                setFrontFile, 
                dragFront, 
                setDragFront, 
                "front-upload"
            )}
            
            {renderUploadBox(
                "Back View", 
                "Optional", 
                backFile, 
                setBackFile, 
                dragBack, 
                setDragBack, 
                "back-upload"
            )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!frontFile || !productName || !isConfigured}
          className={`w-full py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 transform
            ${!frontFile || !productName || !isConfigured 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-900 hover:-translate-y-0.5 shadow-lg shadow-gray-200'}
          `}
        >
          {!isConfigured ? (
             <span>Configure API Keys to Continue</span>
          ) : (
             <>
               <SparklesIcon /> 
               <span>Generate 360° Spin</span>
             </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadView;