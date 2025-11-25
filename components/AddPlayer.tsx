import React, { useState } from 'react';
import { Button } from './Button';
import { UserPlus, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminLogin } from './AdminLogin';

interface AddPlayerProps {
 onAddPlayer: (name: string) => void;
}

export const AddPlayer: React.FC<AddPlayerProps> = ({ onAddPlayer }) => {
 const [name, setName] = useState('');
 const [isExpanded, setIsExpanded] = useState(false);
 const [showLogin, setShowLogin] = useState(false);
 const { isAdmin, logout } = useAdmin();

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (name.trim()) {
 onAddPlayer(name.trim());
 setName('');
 setIsExpanded(false);
 }
 };

 // Om användaren inte är admin, visa bara en diskret inloggningsknapp
 if (!isAdmin) {
 return (
 <div className="flex justify-center mt-6">
 <button 
 onClick={() => setShowLogin(true)}
 className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs font-medium"
 >
 <Lock className="w-3 h-3 group-hover:text-emerald-500 transition-colors" />
 Admin Access
 </button>
 <AdminLogin isOpen={showLogin} onClose={() => setShowLogin(false)} />
 </div>
 );
 }

 // Admin-vy
 if (!isExpanded) {
 return (
 <div className="space-y-3">
 <button 
 onClick={() => setIsExpanded(true)}
 className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-700 font-medium flex items-center justify-center gap-2 transition-all"
 >
 <UserPlus className="w-5 h-5" />
 Lägg till ny spelare
 </button>
 
 <div className="flex justify-center">
 <button 
 onClick={logout}
 className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 transition-colors"
 >
 <LogOut className="w-3 h-3" />
 Logga ut admin
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <ShieldCheck className="w-24 h-24" />
 </div>

 <div className="flex justify-between items-center mb-4 relative">
 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
 <UserPlus className="w-5 h-5 text-emerald-600" />
 Ny Spelare
 </h2>
 <button 
 onClick={() => setIsExpanded(false)} 
 className="text-slate-400 hover:text-slate-600 text-sm font-medium"
 >
 Avbryt
 </button>
 </div>
 
 <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative">
 <div className="relative">
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Namn på spelare..."
 className="w-full rounded-lg border-slate-300 border p-3 pl-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
 autoFocus
 required
 />
 <UserPlus className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 </div>
 <Button variant="secondary" type="submit" className="w-full">
 Lägg till i ligan
 </Button>
 </form>
 
 <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-3">
 <p className="text-xs text-slate-400">
 Börjar längst ner i rankingen
 </p>
 <button 
 onClick={logout}
 className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1"
 >
 <LogOut className="w-3 h-3" />
 Logga ut
 </button>
 </div>
 </div>
 );
};
