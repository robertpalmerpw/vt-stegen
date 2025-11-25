import React, { useState } from 'react';
import { Database, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { seedPlayers } from '../services/seedDatabase';
import { useAdmin } from '../hooks/useAdmin';

export const DataSeeder: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  // Visa inte komponenten om man inte är admin
  if (!isAdmin) return null;

  const handleSeed = async () => {
    if (!window.confirm('Är du säker? Detta kommer lägga till 39 spelare i databasen.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await seedPlayers();
      setIsSuccess(true);
      // Dölj success-meddelandet efter 3 sekunder
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      setError('Ett fel uppstod vid importen. Kolla konsolen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 border border-orange-200 bg-orange-50 rounded-xl">
      <h3 className="text-orange-800 font-bold flex items-center gap-2 mb-2">
        <Database className="w-4 h-4" />
        Administrativa Verktyg
      </h3>
      <p className="text-sm text-orange-700 mb-4">
        Använd knappen nedan för att importera startlistan på 39 spelare med automatisk ELO-ranking.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSeed}
          disabled={isLoading || isSuccess}
          // HÄR VAR FELET: Backticks (`) har lagts till runt strängen
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${isSuccess 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importerar...
            </>
          ) : isSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Klar!
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              Importera Startspelare
            </>
          )}
        </button>
        
        {error && (
          <span className="text-red-600 text-xs font-medium">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};