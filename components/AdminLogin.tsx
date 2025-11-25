import React, { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { Lock, X } from 'lucide-react';
import { Button } from './Button';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { verifyPassword } = useAdmin();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPassword(password)) {
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Admininloggning</h2>
          <p className="text-sm text-slate-500">Ange lösenord för att hantera ligan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Lösenord..."
              className={`w-full rounded-xl border p-3 outline-none transition-all ${
                error 
                  ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50' 
                  : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 mt-2 font-medium px-1">
                Fel lösenord. Försök igen.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Logga in
          </Button>
        </form>
      </div>
    </div>
  );
};
