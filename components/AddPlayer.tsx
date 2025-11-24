import React, { useState } from 'react';
import { Button } from './Button';
import { UserPlus } from 'lucide-react';

interface AddPlayerProps {
  onAddPlayer: (name: string) => void;
}

export const AddPlayer: React.FC<AddPlayerProps> = ({ onAddPlayer }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddPlayer(name.trim());
      setName('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-blue-600" />
        Lägg till Spelare
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namn..."
          className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        />
        <Button variant="secondary" type="submit">
          Lägg till
        </Button>
      </form>
      <p className="text-xs text-slate-500 mt-2">
        Nya spelare hamnar längst ner i rankingen.
      </p>
    </div>
  );
};