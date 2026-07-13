import React, { useState, useEffect } from 'react';
import { getSupabase } from '../supabase';
import { Comercio, Producto, CartItem, PedidoDetalle } from '../types';
import { 
  Search, MapPin, Phone, Instagram, Eye, ArrowLeft, ShoppingCart, 
  Plus, Minus, Trash2, CreditCard, Landmark, CheckCircle, Store, 
  HelpCircle, ChevronRight, Share2, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsumerViewProps {
  isDemoMode: boolean;
  localComercios: Comercio[];
  localProductos: Producto[];
  onAddLocalPedido: (pedido: any) => void;
}

const CATEGORIES = ['Todos', 'Restaurantes', 'Cafetería', 'Supermercado', 'Farmacia', 'Otros'];

export default function ConsumerView({ isDemoMode, localComercios, localProductos, onAddLocalPedido }: ConsumerViewProps) {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering
  const [selectedComercio, setSelectedComercio] = useState<Comercio | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  
  // Checkout Form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'linea'>('efectivo');
  
  // Simulated Card Payment State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  
  // Success order reference
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Load data
  useEffect(() => {
    fetchComercios();
  }, [isDemoMode, localComercios]);

  useEffect(() => {
    if (selectedComercio) {
      fetchProductos(selectedComercio.id);
      setCart([]); // Clear cart when switching merchants
    }
  }, [selectedComercio, isDemoMode, localProductos]);

  const fetchComercios = async () => {
    setLoading(true);
    if (isDemoMode) {
      setComercios(localComercios);
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setComercios(localComercios);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('comercios').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setComercios(data);
      } else {
        // Fallback to local if empty in DB
        setComercios(localComercios);
      }
    } catch (err) {
      console.error('Error fetching comercios:', err);
      setComercios(localComercios);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async (comercioId: string) => {
    if (isDemoMode) {
      setProductos(localProductos.filter(p => p.comercio_id === comercioId));
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProductos(localProductos.filter(p => p.comercio_id === comercioId));
        return;
      }

      const { data, error } = await supabase.from('productos').select('*').eq('comercio_id', comercioId);
      if (error) throw error;
      
      setProductos(data || []);
    } catch (err) {
      console.error('Error fetching productos:', err);
      setProductos(localProductos.filter(p => p.comercio_id === comercioId));
    }
  };

  const seedDatabase = async () => {
    const supabase = getSupabase();
    if (!supabase || isDemoMode) return;
    
    setLoading(true);
    try {
      // 1. Insert localComercios
      const { data: insertedComercios, error: errC } = await supabase
        .from('comercios')
        .insert(localComercios.map(({ id, ...rest }) => rest))
        .select();
      
      if (errC) throw errC;

      if (insertedComercios && insertedComercios.length > 0) {
        // 2. Insert localProductos map with new commerce IDs
        const productsToInsert = [];
        for (let i = 0; i < insertedComercios.length; i++) {
          const originalComercio = localComercios[i];
          const newComercio = insertedComercios[i];
          const relatedProducts = localProductos.filter(p => p.comercio_id === originalComercio.id);
          
          for (const prod of relatedProducts) {
            productsToInsert.push({
              comercio_id: newComercio.id,
              nombre: prod.nombre,
              descripcion: prod.descripcion,
              precio: prod.precio,
              imagen_url: prod.imagen_url,
              disponible: prod.disponible
            });
          }
        }

        if (productsToInsert.length > 0) {
          const { error: errP } = await supabase.from('productos').insert(productsToInsert);
          if (errP) throw errP;
        }
      }

      await fetchComercios();
      alert('¡Base de datos inicializada con éxito con datos de prueba!');
    } catch (err: any) {
      console.error('Error seeding DB:', err);
      alert('Error al inicializar la base de datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const addToCart = (producto: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === producto.id);
      if (existing) {
        return prev.map(item => 
          item.producto.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const updateQuantity = (productoId: string, amount: number) => {
    setCart(prev => prev.map(item => {
      if (item.producto.id === productoId) {
        const newQty = item.cantidad + amount;
        return newQty > 0 ? { ...item, cantidad: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productoId: string) => {
    setCart(prev => prev.filter(item => item.producto.id !== productoId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.cantidad, 0);
  };

  // Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !deliveryAddress.trim()) {
      alert('Por favor completa todos los campos del cliente.');
      return;
    }

    if (!selectedComercio) return;

    setPaying(true);

    // If online card payment, simulate payment delay
    if (paymentMethod === 'linea') {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        alert('Por favor ingresa los detalles de la tarjeta de crédito.');
        setPaying(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating Stripe
    }

    const total = getCartTotal();
    const detalles: PedidoDetalle[] = cart.map(item => ({
      id: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad
    }));

    const nuevoPedidoData = {
      comercio_id: selectedComercio.id,
      cliente_nombre: clientName.trim(),
      cliente_telefono: clientPhone.trim(),
      cliente_direccion: deliveryAddress.trim() || null,
      detalles,
      total,
      metodo_pago: paymentMethod,
      estado: 'pendiente' as const,
      created_at: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        // Local state order
        const mockId = Math.random().toString(36).substring(2, 11);
        const completeLocalPedido = { ...nuevoPedidoData, id: mockId };
        onAddLocalPedido(completeLocalPedido);
        setLastOrder(completeLocalPedido);
        setCheckoutStep('success');
      } else {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase no inicializado correctamente.');
        }

        const { data, error } = await supabase.from('pedidos').insert({
          comercio_id: selectedComercio.id,
          cliente_nombre: clientName.trim(),
          cliente_telefono: clientPhone.trim(),
          cliente_direccion: deliveryAddress.trim() || null,
          detalles,
          total,
          metodo_pago: paymentMethod,
          estado: 'pendiente'
        }).select();

        if (error) throw error;

        const insertedOrder = data?.[0] || nuevoPedidoData;
        setLastOrder(insertedOrder);
        setCheckoutStep('success');
      }

      // Trigger WhatsApp redirection if payment is cash or transfer
      if (paymentMethod === 'efectivo' || paymentMethod === 'transferencia') {
        triggerWhatsAppOrder(nuevoPedidoData, selectedComercio);
      }

      // Reset cart and form
      setCart([]);
    } catch (err: any) {
      console.error('Error placing order:', err);
      alert('Error al registrar el pedido: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const triggerWhatsAppOrder = (pedido: any, comercio: Comercio) => {
    const productsList = pedido.detalles
      .map((item: any) => `• ${item.cantidad}x ${item.nombre} ($${item.precio * item.cantidad})`)
      .join('\n');

    const paymentText = 
      pedido.metodo_pago === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia Bancaria';

    const message = `¡Hola! Quiero hacer un pedido a través de *ZeloxCloud* 🚀\n\n` +
      `👤 *Cliente:* ${pedido.cliente_nombre}\n` +
      `📞 *Teléfono:* ${pedido.cliente_telefono}\n` +
      `📍 *Dirección de Entrega:* ${deliveryAddress}\n\n` +
      `📦 *Productos:*\n${productsList}\n\n` +
      `💰 *Total:* $${pedido.total}\n` +
      `💳 *Método de Pago:* ${paymentText}\n\n` +
      `Por favor, confírmame el pedido. ¡Muchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = comercio.telefono_whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  // Filtering Logic
  const filteredComercios = comercios.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.direccion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || c.categoria.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. SEED DATABASE ALERT (Only shown when not in demo mode and database has no items or user wants to quickly set up) */}
      {!isDemoMode && comercios.length === 0 && !loading && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-5 text-amber-300 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-bold flex items-center gap-2 text-white justify-center md:justify-start">
              <Sparkles className="w-5 h-5 text-amber-400" /> ¡Base de datos vacía detectada!
            </h3>
            <p className="text-sm text-amber-400/90">
              ¿Quieres poblar tu base de datos de Supabase con comercios y productos de demostración para probar de inmediato?
            </p>
          </div>
          <button
            onClick={seedDatabase}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-900/40 text-sm shrink-0"
            id="btn-seed-db"
          >
            Generar Comercios de Prueba
          </button>
        </div>
      )}

      {/* VIEW DIRECTORY OF MERCHANTS */}
      {!selectedComercio ? (
        <div className="space-y-6">
          {/* Search and Categories Bar */}
          <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-md">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search className="w-5 h-5" />
              </span>
              <input
                id="search-input-comercios"
                type="text"
                placeholder="Buscar comercios por nombre o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  id={`cat-pill-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${
                    selectedCategory === cat
                      ? 'bg-[#0d9488] text-white border-[#2dd4bf]/20 shadow-lg shadow-[#0d9488]/30 font-semibold'
                      : 'bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10 border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Cargando directorio de comercios...</p>
            </div>
          ) : filteredComercios.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <Store className="w-12 h-12 text-[#94a3b8] mx-auto" />
              <p className="text-slate-400 text-lg font-medium">No se encontraron comercios</p>
              <p className="text-slate-500 text-xs">Prueba ajustando tu búsqueda o filtros de categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="comercios-grid">
              {filteredComercios.map((comercio, idx) => (
                <motion.div
                  key={comercio.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white/5 hover:bg-[#0a0f1d]/80 border border-white/10 hover:border-[#0d9488]/50 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:shadow-[#0d9488]/10 transition-all flex flex-col justify-between group"
                  id={`comercio-card-${comercio.id}`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#2dd4bf] transition-colors">
                        {comercio.nombre}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-[#0d9488]/15 text-[#2dd4bf] border border-[#0d9488]/30 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                        {comercio.categoria}
                      </span>
                    </div>

                    <p className="text-sm text-[#94a3b8] flex items-start gap-2 leading-snug">
                      <MapPin className="w-4 h-4 text-[#94a3b8]/60 shrink-0 mt-0.5" />
                      <span>{comercio.direccion}</span>
                    </p>

                    <p className="text-sm text-[#94a3b8] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#94a3b8]/60 shrink-0" />
                      <span>{comercio.telefono_whatsapp}</span>
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {comercio.instagram_url && (
                        <a
                          id={`instagram-link-${comercio.id}`}
                          href={comercio.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#94a3b8] hover:text-white flex items-center justify-center transition"
                          title="Visitar Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {comercio.maps_url && (
                        <a
                          id={`maps-link-${comercio.id}`}
                          href={comercio.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#94a3b8] hover:text-white flex items-center justify-center transition"
                          title="Ver en Google Maps"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <button
                      id={`btn-view-menu-${comercio.id}`}
                      onClick={() => setSelectedComercio(comercio)}
                      className="bg-[#0d9488] hover:bg-[#115e59] text-white font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-[#0d9488]/20"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Menú y Comprar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* SHOPPING AND MENU FOR SELECTED MERCHANT */
        <div className="space-y-6">
          {/* Merchant Banner */}
          <div className="bg-gradient-to-r from-[#0a0f1d] to-[#0b1329] border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0d9488]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <button
              id="btn-back-to-directory"
              onClick={() => setSelectedComercio(null)}
              className="mb-4 inline-flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Directorio
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedComercio.nombre}</h2>
                  <span className="px-2.5 py-0.5 bg-[#0d9488]/15 text-[#2dd4bf] border border-[#0d9488]/30 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                    {selectedComercio.categoria}
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#94a3b8]/60 shrink-0" />
                  <span>{selectedComercio.direccion}</span>
                </p>
                <p className="text-sm text-[#94a3b8] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#94a3b8]/60 shrink-0" />
                  <span>{selectedComercio.telefono_whatsapp}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedComercio.instagram_url && (
                  <a
                    href={selectedComercio.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-3.5 py-2 rounded-xl text-[#94a3b8] hover:text-white transition"
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {selectedComercio.maps_url && (
                  <a
                    href={selectedComercio.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-3.5 py-2 rounded-xl text-[#94a3b8] hover:text-white transition"
                  >
                    <MapPin className="w-4 h-4" /> Ubicación
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Product Catalog */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-[#0d9488]" /> Catálogo de Productos
            </h3>

            {productos.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-slate-400">Este comercio aún no tiene productos registrados en su menú.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="productos-catalog-grid">
                {productos.map((producto, idx) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className={`bg-white/5 border rounded-2xl overflow-hidden flex flex-col justify-between h-full group ${
                      producto.disponible ? 'border-white/10' : 'border-white/5 opacity-60'
                    }`}
                    id={`product-card-${producto.id}`}
                  >
                    {/* Image Placeholder or Actual URL */}
                    <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      {producto.imagen_url ? (
                        <img
                          src={producto.imagen_url}
                          alt={producto.nombre}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Store className="w-8 h-8 text-[#94a3b8]/40 mx-auto mb-1" />
                          <span className="text-[10px] text-[#94a3b8]/30 font-mono">Sin Imagen</span>
                        </div>
                      )}
                      {!producto.disponible && (
                        <div className="absolute inset-0 bg-[#0a0f1d]/85 flex items-center justify-center">
                          <span className="px-3 py-1 bg-rose-950/80 text-rose-400 border border-rose-900/30 rounded-full text-xs font-bold uppercase tracking-wider">
                            Pausado / Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white text-base group-hover:text-[#2dd4bf] transition-colors">
                            {producto.nombre}
                          </h4>
                          <span className="text-[#2dd4bf] font-extrabold text-base whitespace-nowrap">
                            ${producto.precio}
                          </span>
                        </div>
                        <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                          {producto.descripcion || 'Sin descripción adicional.'}
                        </p>
                      </div>

                      <button
                        id={`btn-add-cart-${producto.id}`}
                        onClick={() => addToCart(producto)}
                        disabled={!producto.disponible}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                          producto.disponible
                            ? 'bg-white/5 hover:bg-[#0d9488] text-white hover:shadow-lg hover:shadow-[#0d9488]/20 border border-white/10 hover:border-transparent'
                            : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar al Carrito
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Cart Trigger */}
          {getCartCount() > 0 && (
            <button
              id="btn-floating-cart"
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="fixed bottom-6 right-6 bg-[#0d9488] hover:bg-[#115e59] text-white rounded-full p-4 shadow-2xl shadow-[#0d9488]/40 flex items-center gap-3 active:scale-95 transition-all z-40 border border-[#2dd4bf]/20 animate-bounce"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white rounded-full text-[10px] w-5.5 h-5.5 flex items-center justify-center font-bold border border-slate-950">
                  {getCartCount()}
                </span>
              </div>
              <span className="font-bold text-sm pr-1">Ver Carrito (${getCartTotal()})</span>
            </button>
          )}
        </div>
      )}

      {/* CART & CHECKOUT DRAWER / MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" id="cart-overlay-container">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 cursor-pointer"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#0a0f1d] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl text-[#94a3b8] z-10"
              id="cart-drawer"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0a0f1d]">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-[#0d9488]" />
                  <h3 className="text-lg font-bold text-white">Tu Carrito de Pedido</h3>
                </div>
                <button
                  id="btn-close-cart-drawer"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#94a3b8] hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {checkoutStep === 'cart' && (
                  <div className="space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-20 space-y-4">
                        <ShoppingCart className="w-12 h-12 text-[#94a3b8]/40 mx-auto" />
                        <p className="text-slate-400">Tu carrito está completamente vacío.</p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="text-[#2dd4bf] hover:underline text-xs"
                        >
                          Explorar productos
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Cart items list */}
                        <div className="space-y-3.5">
                          {cart.map((item) => (
                            <div
                              key={item.producto.id}
                              className="flex gap-4 p-3 bg-white/5 border border-white/10 rounded-xl"
                              id={`cart-item-${item.producto.id}`}
                            >
                              <div className="w-16 h-16 bg-slate-950 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                                {item.producto.imagen_url ? (
                                  <img
                                    src={item.producto.imagen_url}
                                    alt={item.producto.nombre}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Store className="w-6 h-6 text-[#94a3b8]/40" />
                                )}
                              </div>

                              <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div className="flex justify-between gap-2">
                                  <h4 className="font-semibold text-white text-sm line-clamp-1">
                                    {item.producto.nombre}
                                  </h4>
                                  <span className="text-[#2dd4bf] font-bold text-sm">
                                    ${item.producto.precio * item.cantidad}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2 bg-[#1e293b] px-2 py-1 rounded-lg border border-white/10">
                                    <button
                                      onClick={() => updateQuantity(item.producto.id, -1)}
                                      className="text-[#94a3b8] hover:text-white p-0.5 transition"
                                      id={`btn-cart-decrease-${item.producto.id}`}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs text-white font-mono w-4 text-center">
                                      {item.cantidad}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.producto.id, 1)}
                                      className="text-[#94a3b8] hover:text-white p-0.5 transition"
                                      id={`btn-cart-increase-${item.producto.id}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => removeFromCart(item.producto.id)}
                                    className="text-[#94a3b8] hover:text-rose-400 p-1 transition"
                                    id={`btn-cart-delete-${item.producto.id}`}
                                    title="Quitar producto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <div className="flex justify-between text-xs text-[#94a3b8]">
                            <span>Subtotal</span>
                            <span>${getCartTotal()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-[#94a3b8]">
                            <span>Costo de Envío</span>
                            <span className="text-emerald-400 font-semibold">GRATIS</span>
                          </div>
                          <div className="border-t border-white/10 my-2 pt-2 flex justify-between text-sm font-bold text-white">
                            <span>Total de la Orden</span>
                            <span className="text-[#2dd4bf] text-base">${getCartTotal()}</span>
                          </div>
                        </div>

                        {/* Checkout button */}
                        <button
                          id="btn-goto-checkout"
                          onClick={() => setCheckoutStep('checkout')}
                          className="w-full bg-[#0d9488] hover:bg-[#115e59] text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-[#0d9488]/30 flex items-center justify-center gap-2 text-sm"
                        >
                          Continuar al Checkout <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {checkoutStep === 'checkout' && (
                  <form onSubmit={handlePlaceOrder} className="space-y-5" id="form-checkout">
                    {/* Customer Details */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2dd4bf] mb-1">
                        Datos para la Entrega
                      </h4>

                      <div>
                        <label className="block text-xs text-[#94a3b8] mb-1">Nombre Completo</label>
                        <input
                          id="checkout-name"
                          type="text"
                          placeholder="Ej: Juan Pérez"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#94a3b8] mb-1">WhatsApp de Contacto</label>
                        <input
                          id="checkout-phone"
                          type="tel"
                          placeholder="Ej: +5492612345678"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#94a3b8] mb-1">Dirección Completa de Entrega</label>
                        <textarea
                          id="checkout-address"
                          rows={2}
                          placeholder="Calle, Altura, Departamento, Indicaciones..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0d9488]/50 transition-colors placeholder:text-slate-500 resize-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2dd4bf] mb-1">
                        Método de Pago
                      </h4>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          id="pay-method-cash"
                          onClick={() => setPaymentMethod('efectivo')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                            paymentMethod === 'efectivo'
                              ? 'border-[#0d9488] bg-[#0d9488]/20 text-white'
                              : 'border-white/10 bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase">Efectivo</span>
                        </button>

                        <button
                          type="button"
                          id="pay-method-transfer"
                          onClick={() => setPaymentMethod('transferencia')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                            paymentMethod === 'transferencia'
                              ? 'border-[#0d9488] bg-[#0d9488]/20 text-white'
                              : 'border-white/10 bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase">Transfer</span>
                        </button>

                        <button
                          type="button"
                          id="pay-method-online"
                          onClick={() => setPaymentMethod('linea')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                            paymentMethod === 'linea'
                              ? 'border-[#0d9488] bg-[#0d9488]/20 text-white'
                              : 'border-white/10 bg-white/5 text-[#94a3b8] hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase">Online</span>
                        </button>
                      </div>

                      {/* Payment context explanations */}
                      {paymentMethod === 'efectivo' && (
                        <p className="text-[11px] text-[#94a3b8] leading-relaxed bg-white/5 p-2.5 border border-white/10 rounded-lg">
                          Pagas en mano cuando el repartidor llegue a tu domicilio. Confirmarás el pedido abriendo un chat de WhatsApp con el comercio.
                        </p>
                      )}

                      {paymentMethod === 'transferencia' && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
                          <p className="text-slate-300 font-semibold flex items-center gap-1">
                            <Landmark className="w-3.5 h-3.5 text-[#0d9488]" /> Datos de Transferencia:
                          </p>
                          <div className="space-y-1 text-[#94a3b8] font-mono text-[11px]">
                            <p><strong>Banco:</strong> Zelox Bank Co.</p>
                            <p><strong>Alias:</strong> zelox.cloud.pedido</p>
                            <p><strong>CBU:</strong> 0000003100001234567890</p>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1 border-t border-white/5 leading-snug">
                            Una vez realizada la transferencia, abrirás WhatsApp para enviar el comprobante de pago al comercio.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'linea' && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3 text-xs">
                          <p className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#0d9488]" /> Pago ficticio con Tarjeta / Stripe:
                          </p>
                          
                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5">Número de Tarjeta</label>
                              <input
                                id="card-num"
                                type="text"
                                maxLength={16}
                                placeholder="4532 0000 0000 0000"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0d9488]/50 font-mono"
                                required={paymentMethod === 'linea'}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-0.5">Expira</label>
                                <input
                                  id="card-exp"
                                  type="text"
                                  maxLength={5}
                                  placeholder="MM/AA"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0d9488]/50 font-mono"
                                  required={paymentMethod === 'linea'}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-0.5">CVC / CVV</label>
                                <input
                                  id="card-cvc"
                                  type="password"
                                  maxLength={3}
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0d9488]/50 font-mono"
                                  required={paymentMethod === 'linea'}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        id="btn-back-to-cart"
                        onClick={() => setCheckoutStep('cart')}
                        disabled={paying}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3 px-4 rounded-xl transition border border-white/10 text-xs"
                      >
                        Atrás
                      </button>

                      <button
                        type="submit"
                        id="btn-confirm-order"
                        disabled={paying}
                        className="flex-1 bg-[#0d9488] hover:bg-[#115e59] text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-[#0d9488]/30 flex justify-center items-center gap-2 text-xs"
                      >
                        {paying ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            Confirmar Pedido (${getCartTotal()})
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-16 h-16 bg-emerald-950/50 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle className="w-10 h-10 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">¡Pedido Registrado con Éxito!</h3>
                      <p className="text-sm text-[#94a3b8] leading-relaxed max-w-sm mx-auto">
                        Tu pedido ha sido guardado en el ecosistema de ZeloxCloud para el comercio.
                      </p>
                    </div>

                    {lastOrder && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-xs">
                        <p className="text-slate-300 font-semibold">Resumen de la Orden:</p>
                        <div className="space-y-1 text-[#94a3b8]">
                          <p><strong>ID de Pedido:</strong> <span className="font-mono text-[#2dd4bf]">{lastOrder.id?.substring(0, 8)}...</span></p>
                          <p><strong>Cliente:</strong> {lastOrder.cliente_nombre}</p>
                          <p><strong>Total:</strong> ${lastOrder.total}</p>
                          <p><strong>Método de Pago:</strong> {lastOrder.metodo_pago === 'linea' ? '💳 Pago en línea' : lastOrder.metodo_pago === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia bancaria'}</p>
                        </div>
                      </div>
                    )}

                    {(paymentMethod === 'efectivo' || paymentMethod === 'transferencia') ? (
                      <div className="p-4 bg-teal-950/20 border border-teal-900/30 rounded-2xl text-xs text-[#2dd4bf] space-y-3 leading-relaxed">
                        <p>
                          Hemos preparado tu mensaje estructurado. Si tu navegador bloqueó la ventana emergente de WhatsApp, puedes usar el siguiente botón para abrirlo manualmente y concluir tu orden:
                        </p>
                        <button
                          id="btn-reopen-whatsapp"
                          onClick={() => triggerWhatsAppOrder(lastOrder, selectedComercio)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 mx-auto transition shadow-lg shadow-emerald-900/30"
                        >
                          <Phone className="w-3.5 h-3.5" /> Abrir WhatsApp Nuevamente
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl text-xs text-emerald-400 leading-relaxed">
                        ¡Pago completado de forma simulada mediante Stripe! El comercio recibirá la notificación instantánea en su panel de administración para comenzar a preparar tu envío.
                      </div>
                    )}

                    <button
                      id="btn-back-to-menu-success"
                      onClick={() => {
                        setIsCartOpen(false);
                        setSelectedComercio(null);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold py-3 px-4 rounded-xl transition"
                    >
                      Volver al Directorio
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
