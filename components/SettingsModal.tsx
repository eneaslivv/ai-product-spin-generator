import React, { useState, useEffect } from 'react';
import { ApiKeys } from '../types';
import { XIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKeys, onSave }) => {
  const [formData, setFormData] = useState<ApiKeys>(apiKeys);

  useEffect(() => {
    setFormData(apiKeys);
  }, [apiKeys, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">System Configuration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-50">
            <XIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Google AI Studio Key</label>
              <input
                type="password"
                name="googleApiKey"
                value={formData.googleApiKey}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all text-sm"
              />
              <p className="text-[10px] text-gray-400 font-medium">For Gemini 2.5 Image Enhancement</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">FAL.ai Key</label>
              <input
                type="password"
                name="falKey"
                value={formData.falKey}
                onChange={handleChange}
                placeholder="key_..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all text-sm"
              />
              <p className="text-[10px] text-gray-400 font-medium">For 360° Video Generation</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4 opacity-70 hover:opacity-100 transition-opacity">
             <h4 className="text-xs font-bold text-gray-900">Supabase Integration <span className="text-gray-400 font-normal">(Optional)</span></h4>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Project URL</label>
                    <input
                      type="text"
                      name="supabaseUrl"
                      value={formData.supabaseUrl}
                      onChange={handleChange}
                      placeholder="https://xyz.supabase.co"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs placeholder:text-gray-300 focus:border-black focus:outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Anon Key</label>
                    <input
                      type="password"
                      name="supabaseAnonKey"
                      value={formData.supabaseAnonKey}
                      onChange={handleChange}
                      placeholder="eyJh..."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs placeholder:text-gray-300 focus:border-black focus:outline-none"
                    />
                </div>
             </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white hover:bg-gray-900 active:scale-[0.99] transition-all shadow-lg shadow-gray-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;