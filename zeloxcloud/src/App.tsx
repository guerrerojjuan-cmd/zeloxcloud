import React, { useState, useEffect } from 'react';
import { getSavedCredentials, getSupabase } from './supabase';
import { Comercio, Producto, Pedido, AppView } from './types';
import { MOCK_COMERCIOS, MOCK_PRODUCTOS, MOCK_PEDIDOS } from './data';
import ConsumerView from './components/ConsumerView';
import MerchantView from './components/MerchantView';
import SupabaseSetup from './components/SupabaseSetup';
import { 
  CloudLightning, Database, Settings, ShieldAlert, CheckCircle2, 
  HelpCircle, User, Store, ArrowLeftRight, ExternalLink, Globe 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SQL_SCHEMA = `-- 1. Crear tabla de Comercios
CREATE TABLE IF NOT EXISTS public.comercios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono_whatsapp VARCHAR(50) NOT NULL,
    direccion TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    instagram_url TEXT,
    maps_url TEXT,
    activo BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    imagen_url TEXT,
    disponible BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(50) NOT NULL,
    cliente_direccion TEXT,
    detalles JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para seguridad
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso libre para pruebas/MVP
CREATE POLICY "Acceso publico lectura comercios" ON public.comercios FOR SELECT USING (true);
CREATE POLICY "Acceso publico insercion comercios" ON public.comercios FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso publico modificacion comercios" ON public.comercios FOR UPDATE USING (true);

CREATE POLICY "Acceso publico lectura productos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Acceso publico insercion productos" ON public.productos FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso publico modificacion productos" ON public.productos FOR UPDATE USING (true);
CREATE POLICY "Acceso publico eliminacion productos" ON public.productos FOR DELETE USING (true);

CREATE POLICY "Acceso publico total pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);`;

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('consumidor');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  // Shared Local States for Demo Mode / Immediate sandbox interactive testing
  const [localComercios, setLocalComercios] = useState<Comercio[]>(() => {
    const saved = localStorage.getItem('zelox_local_comercios');
    return saved ? JSON.parse(saved) : MOCK_COMERCIOS;
  });

  const [localProductos, setLocalProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('zelox_local_productos');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTOS;
  });

  const [localPedidos, setLocalPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('zelox_local_pedidos');
    return saved ? JSON.parse(saved) : MOCK_PEDIDOS;
  });

  // Check Supabase connection state
  useEffect(() => {
    verifySupabaseConnection();
  }, []);

  // Sync state changes with localStorage for persistent demo sandboxing
  useEffect(() => {
    localStorage.setItem('zelox_local_comercios', JSON.stringify(localComercios));
  }, [localComercios]);

  useEffect(() => {
    localStorage.setItem('zelox_local_productos', JSON.stringify(localProductos));
  }, [localProductos]);

  useEffect(() => {
    localStorage.setItem('zelox_local_pedidos', JSON.stringify(localPedidos));
  }, [localPedidos]);

  const verifySupabaseConnection = async () => {
    const creds = getSavedCredentials();
    
    // Check if valid credentials are saved
    if (!creds.url || !creds.key || creds.url.includes('demo.supabase')) {
      setIsDemoMode(true);
      setSupabaseConnected(false);
      setTablesMissing(false);
      return;
    }

    try {
      const client = getSupabase();
      if (!client) {
        setIsDemoMode(true);
        setSupabaseConnected(false);
        setTablesMissing(false);
        return;
      }

      // Check schema availability
      const { data, error } = await client.from('comercios').select('id').limit(1);
      
      if (!error) {
        setIsDemoMode(false);
        setSupabaseConnected(true);
        setTablesMissing(false);
      } else if (error.code === 'PGRST111') {
        // Connected successfully to Supabase, but schema not yet initialized!
        // We keep isDemoMode as TRUE to run smoothly in mock sandbox, but signal the missing tables!
        setIsDemoMode(true);
        setSupabaseConnected(true);
        setTablesMissing(true);
      } else {
        setIsDemoMode(true);
        setSupabaseConnected(false);
        setTablesMissing(false);
      }
    } catch (err) {
      console.warn('Supabase offline or invalid keys, falling back to Sandbox Demo mode.', err);
      setIsDemoMode(true);
      setSupabaseConnected(false);
      setTablesMissing(false);
    }
  };

  const handleConfigured = () => {
    verifySupabaseConnection();
    setShowSetupModal(false);
  };

  // State update callbacks for local Sandbox Demo mode
  const handleAddLocalPedido = (pedido: Pedido) => {
    setLocalPedidos(prev => [pedido, ...prev]);
  };

  const handleUpdateLocalPedidoEstado = (id: string, nuevoEstado: 'pendiente' | 'preparando' | 'enviado') => {
    setLocalPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
  };

  const handleUpdateLocalProductos = (updatedProds: Producto[]) => {
    setLocalProductos(updatedProds);
  };

  return (
    <div className="min-h-screen bg-[#0b1329] text-[#94a3b8] font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* 1. APP NAVBAR / HEADER */}
      <header className="sticky top-0 z-30 bg-[#0a0f1d] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center shadow-lg shadow-[#0d9488]/40">
                <CloudLightning className="w-5 h-5 text-white font-bold animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#2dd4bf] bg-clip-text text-transparent">
                  ZeloxCloud
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-[#0d9488]/20 border border-[#0d9488]/30 text-[#2dd4bf] px-2 py-0.5 rounded-full ml-2 font-semibold">
                  MVP v1.0
                </span>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-3">
              <button
                id="btn-connection-status"
                onClick={() => setShowSetupModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wider uppercase border transition-all ${
                  supabaseConnected && !isDemoMode
                    ? 'bg-[#0d9488]/10 border-[#0d9488]/30 text-[#2dd4bf] hover:bg-[#0d9488]/20'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }`}
                title="Configuración de Base de Datos"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {supabaseConnected && !isDemoMode ? 'Supabase Activo' : 'Ecosistema Demo'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full animate-ping bg-current"></span>
              </button>

              {/* Mode Toggle Button */}
              <button
                id="btn-switch-view"
                onClick={() => setCurrentView(currentView === 'consumidor' ? 'comerciante' : 'consumidor')}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/10 transition active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#2dd4bf]" />
                <span>
                  {currentView === 'consumidor' ? 'Vista Comercio' : 'Vista Cliente'}
                </span>
              </button>

              {/* Settings Trigger */}
              <button
                id="btn-trigger-settings"
                onClick={() => setShowSetupModal(true)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[#94a3b8] hover:text-white transition"
                title="Configurar Supabase"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection Sandbox Note / Banner */}
        {tablesMissing ? (
          <div className="mb-6 p-6 bg-[#0a0f1d]/80 border border-rose-500/30 rounded-2xl flex flex-col gap-4 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>¡Supabase Conectado, pero faltan las tablas en tu base de datos!</span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Tus credenciales de Supabase son correctas, pero a tu base de datos le faltan las tablas requeridas (<strong>comercios</strong>, <strong>productos</strong> y <strong>pedidos</strong>). El sistema se mantendrá de forma segura en <strong>Modo Demo</strong> para evitar errores. Ejecuta el script SQL a continuación en la sección <strong>SQL Editor</strong> de tu panel de Supabase para activar la base de datos real.
                </p>
              </div>
              <div className="flex gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_SCHEMA);
                    alert('¡Script SQL copiado al portapapeles! Pégalo y ejecútalo en la pestaña SQL Editor de Supabase.');
                  }}
                  className="flex-1 md:flex-none bg-[#0d9488] hover:bg-[#115e59] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
                >
                  Copiar Script SQL
                </button>
                <button
                  onClick={verifySupabaseConnection}
                  className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 transition active:scale-95 cursor-pointer"
                >
                  Volver a Comprobar
                </button>
              </div>
            </div>
            
            <div className="bg-black/35 border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre leading-relaxed">
              {SQL_SCHEMA}
            </div>
          </div>
        ) : isDemoMode ? (
          <div className="mb-6 p-5 bg-[#0a0f1d]/60 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                <span>Modo de Demostración y Sandbox Local</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                ZeloxCloud está corriendo en un entorno local aislado. Puedes simular pedidos, gestionar menús y explorar el panel administrativo sin límites. 
                Los pedidos que hagas como <strong>Consumidor</strong> aparecerán instantáneamente en la pantalla de <strong>Comercio</strong>.
              </p>
            </div>
            <button
              id="btn-setup-supabase-banner"
              onClick={() => setShowSetupModal(true)}
              className="bg-[#0d9488] hover:bg-[#115e59] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-[#0d9488]/20 whitespace-nowrap self-start md:self-center active:scale-95"
            >
              Conectar Base de Datos Real
            </button>
          </div>
        ) : null}

        {/* View Switcher Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {currentView === 'consumidor' ? (
              <ConsumerView
                isDemoMode={isDemoMode}
                localComercios={localComercios}
                localProductos={localProductos}
                onAddLocalPedido={handleAddLocalPedido}
              />
            ) : (
              <MerchantView
                isDemoMode={isDemoMode}
                localComercios={localComercios}
                localProductos={localProductos}
                localPedidos={localPedidos}
                onAddLocalPedido={handleAddLocalPedido}
                onUpdateLocalPedidoEstado={handleUpdateLocalPedidoEstado}
                onUpdateLocalProductos={handleUpdateLocalProductos}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* 3. DYNAMIC CONFIGURATION MODAL */}
      <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" id="setup-modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
            >
              <SupabaseSetup 
                onConfigured={handleConfigured} 
                onClose={() => setShowSetupModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. FOOTER */}
      <footer className="py-8 mt-12 border-t border-white/5 bg-[#0a0f1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2026 ZeloxCloud. Todos los derechos reservados.
          </p>
          <div className="flex justify-center items-center gap-3.5 text-[#64748b] text-[10px]">
            <span>Hecho con React & Tailwind CSS</span>
            <span>•</span>
            <span>Supabase Realtime Integrado</span>
            <span>•</span>
            <span>Ecosistema Local Móvil-Primero</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
