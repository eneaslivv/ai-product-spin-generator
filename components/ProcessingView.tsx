import React from 'react';
import { ProcessingStep } from '../types';
import { CheckIcon } from './Icons';

interface ProcessingViewProps {
  steps: ProcessingStep[];
  previewImage?: string | null;
  isEnhanced?: boolean;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ steps, previewImage, isEnhanced = false }) => {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 animate-fade-in flex flex-col items-center">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-lg font-medium text-gray-900">
           {isEnhanced ? "Modeling 3D Geometry" : "Enhancing Product Image"}
        </h2>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
          AI Processing in progress
        </p>
      </div>

      <div className="relative w-full max-w-sm aspect-square mb-12">
          {/* Main Display Card */}
         <div className="absolute inset-0 bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-500">
             {previewImage && (
                 <img 
                   src={previewImage} 
                   alt="Processing" 
                   className={`w-[85%] h-[85%] object-contain transition-all duration-1000 ${isEnhanced ? 'opacity-100 scale-100 filter-none' : 'opacity-70 scale-95 blur-sm'}`} 
                 />
             )}
         </div>

         {/* Badges & Loaders */}
         <div className="absolute inset-0 pointer-events-none">
            {/* Enhanced Badge */}
            <div className={`absolute top-4 right-4 transition-all duration-700 transform ${isEnhanced ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
              <span className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                 Enhanced
              </span>
            </div>
            
            {/* Loading Indicator */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="bg-white/95 backdrop-blur border border-gray-100 shadow-md rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-3">
                   <div className="spin-loader !w-5 !h-5 !border-gray-200 !border-l-black"></div>
                   <span className="text-xs font-medium text-gray-600">
                      {isEnhanced ? "Generating video..." : "Cleaning image..."}
                   </span>
                </div>
            </div>
         </div>
      </div>

      {/* Minimal Stepper */}
      <div className="w-full max-w-xs space-y-5">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 group">
             {/* Line connector */}
            <div className="relative flex items-center justify-center">
               <div className={`w-3 h-3 rounded-full border transition-all duration-500 z-10 
                  ${step.status === 'success' ? 'bg-black border-black' : ''}
                  ${step.status === 'loading' ? 'bg-white border-black scale-110' : ''}
                  ${step.status === 'pending' ? 'bg-white border-gray-200' : ''}
                  ${step.status === 'error' ? 'bg-red-500 border-red-500' : ''}
               `}></div>
               {/* Vertical Line */}
               {index < steps.length - 1 && (
                  <div className={`absolute top-3 w-[1px] h-9 transition-colors duration-500 ${step.status === 'success' ? 'bg-black' : 'bg-gray-100'}`}></div>
               )}
            </div>
            
            <div className="flex-1 flex justify-between items-center">
              <p className={`text-sm font-medium transition-colors duration-300 ${step.status === 'pending' ? 'text-gray-300' : 'text-gray-900'}`}>
                {step.label}
              </p>
              {step.status === 'success' && <div className="text-black"><CheckIcon /></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingView;