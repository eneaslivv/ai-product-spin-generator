import React from 'react';
import { SettingsIcon, Rotate3dIcon, GridIcon, PlusIcon } from './Icons';

interface HeaderProps {
  onOpenSettings: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToCreate: () => void;
  currentView: 'upload' | 'dashboard' | 'processing' | 'result' | 'error';
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onNavigateToDashboard, onNavigateToCreate, currentView }) => {
  return (
    <header className="fixed top-0 z-50 w-full glass border-b border-gray-100">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white transition-transform duration-300 group-hover:scale-105 shadow-md shadow-gray-200">
            <Rotate3dIcon />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-gray-900">
              SpinGen
            </span>
            <span className="text-[10px] font-medium text-gray-400 tracking-wide">
              PRO EDITION
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {currentView !== 'upload' && (
            <button 
              onClick={onNavigateToCreate}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-black transition-colors rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50"
            >
              <PlusIcon />
              <span>Crear Nuevo</span>
            </button>
          )}
          {currentView !== 'dashboard' && (
            <button 
              onClick={onNavigateToDashboard}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-black transition-colors rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50"
            >
              <GridIcon />
              <span>Mis Creaciones</span>
            </button>
          )}
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-black transition-colors rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50"
          >
            <SettingsIcon />
            <span>Config</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;