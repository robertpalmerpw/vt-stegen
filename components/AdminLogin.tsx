import React, { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { Lock, X, LogIn } from 'lucide-react';
import { Button } from './Button';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  isGlobal?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, isGlobal = false }) => {
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 ${isGlobal ? 'bg-slate-900/90' : ''}`}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative overflow-hidden">
        {/* Visa endast stäng-kryss om det inte är den globala inloggningen */}
        {!isGlobal && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Dekorativ header */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
        
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isGlobal ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            {isGlobal ? (
              <LogIn className="w-7 h-7 text-emerald-600" />
            ) : (
              <Lock className="w-7 h-7 text-slate-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {isGlobal ? 'Välkommen' : 'Admininloggning'}
          </h2>
          <p className="text-sm text-slate-500 text-center max-w-[85%]">
            {isGlobal 
              ? 'Ange lösenord för att låsa upp och se ligan' 
              : 'Ange admin-lösenord för att hantera ligan'}
          </p>
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
              <p className="text-xs text-red-500 mt-2 font-medium px-1 text-center">
                Fel lösenord. Försök igen.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full py-3">
            {isGlobal ? 'Lås upp appen' : 'Logga in'}
          </Button>
        </form>
      </div>
    </div>
  );
};
