import React, { useState, useEffect } from 'react';
import { getSavedCredentials, saveCredentials, initSupabase } from '../supabase';
import { Database, ShieldAlert, CheckCircle, HelpCircle, X } from 'lucide-react';

interface SupabaseSetupProps {
  onConfigured: () => void;
  onClose?: () => void;
  inline?: boolean;
}

export default function SupabaseSetup({ onConfigured, onClose, inline = false }: SupabaseSetupProps) {
  const { url: initialUrl, key: initialKey, isEnv } = getSavedCredentials();
  const [url, setUrl] = useState(initialUrl);
  const [key, setKey] = useState(initialKey);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatus('error');
      setErrorMessage('Por favor ingresa tanto la URL de Supabase como la Clave Anon.');
      return;
    }

    setStatus('testing');
    setErrorMessage('');

    try {
      const client = initSupabase(url, key);
      if (!client) {
        throw new Error('No se pudo instanciar el cliente.');
      }

      // Test connection by executing a dummy query on the profiles or comercios table
      // Note: We try to fetch from 'comercios' table, if it fails because table doesn't exist, it means the URL/key is correct but database schema is not ready,
      // or if it's an auth error, we know it's invalid keys.
      const { data, error } = await client.from('comercios').select('id').limit(1);
      
      if (error && error.code === 'PGRST111') { // Table not found
        // The credentials are correct but the schema might not be provisioned yet, which is a success connection wise
        setStatus('success');
        saveCredentials(url, key);
        setTimeout(() => {
          onConfigured();
        }, 1000);
      } else if (error && ((error as any).status === 401 || (error as any).status === 403 || error.message.includes('Invalid API key'))) {
        setStatus('error');
        setErrorMessage('Credenciales inválidas. Por favor, verifica la URL y la Anon Key.');
      } else {
        // Successful connection
        setStatus('success');
        saveCredentials(url, key);
        setTimeout(() => {
          onConfigured();
          if (onClose) onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Error de conexión. Revisa los datos ingresados.');
    }
  };

  const useDemoMode = () => {
    // Save placeholder values for demo mode
    saveCredentials('https://zelox-demo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo');
    onConfigured();
    if (onClose) onClose();
  };

  return (
    <div className={`p-6 rounded-2xl bg-[#0a0f1d] border border-white/10 text-[#94a3b8] shadow-2xl max-w-lg w-full mx-auto ${inline ? '' : 'backdrop-blur-sm'}`}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-[#0d9488] animate-pulse" />
          <h2 className="text-xl font-bold text-white tracking-tight">Configuración de Supabase</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition" id="btn-close-setup">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed">
        ZeloxCloud requiere una conexión activa a tu proyecto de Supabase para almacenar comercios, productos y gestionar los pedidos en tiempo real.
      </p>

      {isEnv && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-400 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Detectadas credenciales en variables de entorno (.env). Puedes usarlas o sobrescribirlas a continuación de manera local.</span>
        </div>
      )}

      <form onSubmit={handleTestAndSave} className="space-y-4" id="form-supabase-setup">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1.5">
            Supabase URL
          </label>
          <input
            id="input-supabase-url"
            type="url"
            placeholder="https://your-project.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === 'testing'}
            className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1.5 flex justify-between items-center">
            <span>Supabase Anon Key (PublicKey)</span>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-[#2dd4bf] hover:text-teal-400 text-xs flex items-center gap-1 transition"
              id="btn-toggle-help"
            >
              <HelpCircle className="w-3.5 h-3.5" /> ¿Dónde la encuentro?
            </button>
          </label>
          <input
            id="input-supabase-key"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={status === 'testing'}
            className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500 font-mono"
            required
          />
        </div>

        {showHelp && (
          <div className="p-3.5 bg-[#0a0f1d]/80 border border-white/5 rounded-xl text-xs text-[#94a3b8] space-y-1.5 leading-relaxed">
            <p className="font-semibold text-white">Para obtener tus claves de Supabase:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Inicia sesión en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#2dd4bf] underline">supabase.com</a> y ve a tu proyecto.</li>
              <li>Ve a <strong>Project Settings</strong> (icono de engranaje abajo a la izquierda).</li>
              <li>Haz clic en la pestaña <strong>API</strong>.</li>
              <li>Copia el <strong>Project URL</strong> y colócalo en el primer campo.</li>
              <li>Copia la clave <strong>anon / public</strong> y colócala en el segundo campo.</li>
            </ol>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-400 flex items-start gap-2 animate-shake" id="setup-error-msg">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-400 flex items-center gap-2" id="setup-success-msg">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>¡Conexión establecida con éxito! Redirigiendo...</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            id="btn-save-credentials"
            type="submit"
            disabled={status === 'testing'}
            className="flex-1 bg-[#0d9488] hover:bg-[#115e59] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#0d9488]/30 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
          >
            {status === 'testing' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            {status === 'testing' ? 'Verificando...' : 'Conectar Base de Datos'}
          </button>

          <button
            id="btn-use-demo"
            type="button"
            onClick={useDemoMode}
            disabled={status === 'testing'}
            className="bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-white/10 text-sm active:scale-[0.98]"
          >
            Modo Demo
          </button>
        </div>
      </form>
    </div>
  );
}
