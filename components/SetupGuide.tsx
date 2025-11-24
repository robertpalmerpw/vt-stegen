import React from 'react';
import { Cloud, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { firebaseConfig } from '../services/firebaseConfig';

export const SetupGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border-4 border-slate-800">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="bg-yellow-100 p-3 rounded-full">
             <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Konfiguration krävs</h1>
            <p className="text-slate-500">Koppla appen till din egen Firebase-databas</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
            <p className="font-semibold mb-1">Varför ser jag detta?</p>
            Du har aktiverat Firebase-läget, men filen <code>services/firebaseConfig.ts</code> innehåller fortfarande exempelkod ("DITT_PROJEKT_ID").
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Gör så här:
            </h3>
            
            <ol className="list-decimal list-inside space-y-3 text-slate-600 text-sm ml-2">
              <li className="pl-2">
                Gå till <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">Firebase Console</a> och skapa ett nytt projekt.
              </li>
              <li className="pl-2">
                I menyn till vänster, välj <strong>Build {'>'} Firestore Database</strong> och klicka <strong>Create Database</strong>.
                <br />
                <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-1 inline-block">Viktigt: Välj <strong>Start in Test Mode</strong> för att slippa behörighetsproblem i början.</span>
              </li>
              <li className="pl-2">
                Gå till <strong>Project Overview</strong> (huset högst upp till vänster), klicka på kugghjulet och välj <strong>Project settings</strong>.
              </li>
              <li className="pl-2">
                Scrolla ner till "Your apps", klicka på web-ikonen (<code>&lt;/&gt;</code>) för att skapa en web-app.
              </li>
              <li className="pl-2">
                Kopiera innehållet i <code>firebaseConfig</code> som visas.
              </li>
              <li className="pl-2">
                Öppna filen <code>services/firebaseConfig.ts</code> i din kodredigerare och ersätt innehållet med dina nycklar.
              </li>
            </ol>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">Nuvarande status</p>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <span className="text-purple-400">export const</span> firebaseConfig = {'{'}
              <br />
              &nbsp;&nbsp;apiKey: <span className="text-green-400">"{firebaseConfig.apiKey}"</span>,
              <br />
              &nbsp;&nbsp;projectId: <span className="text-red-400">"{firebaseConfig.projectId}"</span> <span className="text-slate-500">// ❌ Måste ändras</span>
              <br />
              &nbsp;&nbsp;...
              <br />
              {'}'};
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};