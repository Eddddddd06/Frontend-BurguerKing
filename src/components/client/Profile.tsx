import { useState, useEffect } from "react";
import { CheckCircle2, Clock, ChefHat, Package, Bike, Plus, LogOut, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { getProfile, getMenu } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { ImageWithFallback } from "../ImageWithFallback";

interface ProfileData {
  nombre: string;
  email: string;
  direccion: string;
  departamento: string;
  tarjeta: string | null;
  historial_pedidos: Array<{
    pedido_id: string;
    estado: string;
    total: number;
    origen: string;
    direccion_entrega: string;
    departamento_entrega: string;
    notificacion?: string;
    items: Array<{
      producto_id: string;
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }>;
  }>;
  favoritos: Array<{
    producto_id: string;
    nombre: string;
    precio_unitario: number;
  }>;
}

export function Profile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, logout, sede } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [cancelledOrder, setCancelledOrder] = useState<{pedido_id: string; notificacion: string} | null>(null);
  const [dismissedCancellations, setDismissedCancellations] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('dismissedCancellations');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    const fetchInitialData = async () => {
      try {
        const [profData, menuData] = await Promise.all([
          getProfile(),
          getMenu(sede)
        ]);
        setProfileData(profData);
        setMenuItems(menuData.menu || []);
      } catch (err: any) {
        setError(err.message || 'Error cargando perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    
    // Solo hacemos poll de getProfile para actualizaciones de estado, getMenu no necesita polling
    const pollProfile = async () => {
      try {
        const data = await getProfile();
        setProfileData(data);
      } catch (err) {
        // Silently fail polling errors
      }
    };
    const interval = setInterval(pollProfile, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  // Detect cancelled orders and show popup
  useEffect(() => {
    if (profileData) {
      const cancelled = profileData.historial_pedidos.find(
        o => o.estado === 'CANCELADO' && !dismissedCancellations.has(o.pedido_id)
      );
      if (cancelled) {
        setCancelledOrder({
          pedido_id: cancelled.pedido_id,
          notificacion: cancelled.notificacion || 'Hubo un problema, su pedido ha sido cancelado y se efectuará el reembolso correspondiente.',
        });
      }
    }
  }, [profileData, dismissedCancellations]);

  const dismissCancellation = () => {
    if (cancelledOrder) {
      const newSet = new Set(dismissedCancellations).add(cancelledOrder.pedido_id);
      setDismissedCancellations(newSet);
      localStorage.setItem('dismissedCancellations', JSON.stringify(Array.from(newSet)));
      setCancelledOrder(null);
    }
  };

  const states = [
    { id: "PENDIENTE_PAGO", label: "Pendiente", icon: Clock },
    { id: "EN_COCINA", label: "Cocina", icon: ChefHat },
    { id: "EN_EMPAQUE", label: "Empaque", icon: Package },
    { id: "EN_REPARTO", label: "Reparto", icon: Bike },
    { id: "ENTREGADO", label: "Entregado", icon: CheckCircle2 },
  ];

  const handleAddFavorite = async (producto_id: string) => {
    try {
      await addItem(producto_id);
    } catch (err: any) {
      alert(err.message || 'Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60 font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error || 'No se pudo cargar el perfil'}
        </div>
      </div>
    );
  }

  // Find active order (not ENTREGADO)
  const activeOrder = profileData.historial_pedidos.find(
    o => o.estado !== 'ENTREGADO' && o.estado !== 'CANCELADO'
  );
  
  // Map backend states to our tracking states
  const getTrackingState = (estado: string): string => {
    const stateMap: Record<string, string> = {
      'PENDIENTE_PAGO': 'PENDIENTE_PAGO',
      'PAGADO': 'EN_COCINA',
      'PAGADO_EXTERNO': 'EN_COCINA',
      'EN_COCINA': 'EN_COCINA',
      'EN_EMPAQUE': 'EN_EMPAQUE',
      'EN_REPARTO': 'EN_REPARTO',
      'ENTREGADO': 'ENTREGADO',
    };
    return stateMap[estado] || 'PENDIENTE_PAGO';
  };

  const activeOrderState = activeOrder ? getTrackingState(activeOrder.estado) : null;
  const currentStateIndex = activeOrderState ? states.findIndex(s => s.id === activeOrderState) : -1;

  // Completed orders for history
  const pastOrders = profileData.historial_pedidos.filter(
    o => o.estado === 'ENTREGADO' || o.estado === 'CANCELADO'
  );

  // Get EN_REPARTO message
  const getStatusMessage = (estado: string): string | null => {
    if (estado === 'EN_REPARTO') {
      return '¡Tu festín ha sido asignado a un motorizado de la realeza y está en camino! Espéralo en tu puerta.';
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 border-b border-border pb-4 flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold">Hola, {profileData.nombre} 👋</h1>
          <p className="text-foreground/60 mt-2 font-medium">Revisa tus pedidos, seguimiento y productos favoritos.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive font-bold rounded-lg hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      <div className="flex flex-col gap-10">
        
        {/* Seguimiento de Pedido Activo */}
        {activeOrder && (
          <section>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-[12px] p-6 sm:p-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                Pedido Activo
              </div>
              
              <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-2">
                <Bike className="text-primary" /> Seguimiento de Pedido #{activeOrder.pedido_id.substring(0, 8).toUpperCase()}
              </h2>

              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-border -z-10 mx-6 sm:mx-12"></div>
                <div 
                  className="absolute top-6 left-0 h-1 bg-success -z-10 mx-6 sm:mx-12 transition-all duration-1000"
                  style={{ width: `${currentStateIndex >= 0 ? (currentStateIndex / (states.length - 1)) * 100 : 0}%` }}
                ></div>

                {/* Progress Steps */}
                <div className="flex justify-between relative z-10">
                  {states.map((state, index) => {
                    const Icon = state.icon;
                    const isActive = index === currentStateIndex;
                    const isCompleted = index < currentStateIndex;
                    
                    return (
                      <div key={state.id} className="flex flex-col items-center gap-2 flex-1">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-4 transition-colors ${
                          isActive ? "bg-white border-primary text-primary shadow-lg scale-110" : 
                          isCompleted ? "bg-success border-success text-white" : 
                          "bg-card border-border text-foreground/40"
                        }`}>
                          <Icon size={24} />
                        </div>
                        <span className={`text-xs sm:text-sm font-bold text-center ${isActive ? "text-primary" : isCompleted ? "text-success" : "text-foreground/40"}`}>
                          {state.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status message for EN_REPARTO */}
              {activeOrderState && getStatusMessage(activeOrderState) && (
                <div className="mt-6 bg-success/10 border border-success/20 rounded-lg p-4 text-success font-medium text-sm">
                  🏍️ {getStatusMessage(activeOrderState)}
                </div>
              )}
              
              <div className="mt-8 bg-white rounded-lg p-4 flex items-center justify-between border border-border">
                <div>
                  <p className="font-bold text-sm">Tiempo estimado</p>
                  <p className="text-2xl font-display text-primary">15 - 25 min</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">Estado</p>
                  <p className="text-foreground/80">{activeOrderState === 'EN_REPARTO' ? 'En camino 🏍️' : 'Procesando...'}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Active tracking was here, empty state removed completely */}

        {/* Favoritos */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Mis Favoritos ❤️</h2>
          {profileData.favoritos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {profileData.favoritos.map((product) => (
                <div key={product.producto_id} className="bg-card rounded-[12px] shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
                    {(() => {
                      const foundMenu = menuItems.find(m => m.producto_id === product.producto_id);
                      if (foundMenu && foundMenu.imagen_url) {
                        return (
                          <ImageWithFallback 
                            src={foundMenu.imagen_url} 
                            alt={product.nombre}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20">
                          <span className="text-4xl">🍔</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.nombre}</h3>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="font-display font-bold text-xl text-primary">
                        S/ {product.precio_unitario.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleAddFavorite(product.producto_id)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-[12px] border border-border p-6 text-center">
              <p className="text-foreground/60">Aún no tienes favoritos. ¡Haz tu primer pedido!</p>
            </div>
          )}
        </section>

        {/* Historial de Pedidos */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Historial de Pedidos</h2>
          {pastOrders.length > 0 ? (
            <div className="bg-card rounded-[12px] shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/5 text-sm uppercase tracking-wider text-foreground/60 border-b border-border">
                      <th className="p-4 font-bold">Nº Pedido</th>
                      <th className="p-4 font-bold">Productos</th>
                      <th className="p-4 font-bold">Estado</th>
                      <th className="p-4 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pastOrders.map((order) => (
                      <tr key={order.pedido_id} className="hover:bg-black/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-sm">{order.pedido_id.substring(0, 8).toUpperCase()}</td>
                        <td className="p-4 text-sm text-foreground/80 max-w-xs truncate">
                          {order.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                        </td>
                        <td className="p-4">
                          {order.estado === 'CANCELADO' ? (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md font-bold uppercase">Cancelado</span>
                          ) : (
                            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-md font-bold uppercase">Entregado</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-right text-primary">S/ {order.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-[12px] border border-border p-6 text-center">
              <p className="text-foreground/60">No tienes pedidos anteriores.</p>
            </div>
          )}
        </section>

      </div>

      {/* Cancellation Popup Modal — same style as Checkout payment modal */}
      {cancelledOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-[12px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-destructive p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold">Pedido Cancelado</h2>
              <p className="text-white/80 text-sm mt-1">Pedido #{cancelledOrder.pedido_id.substring(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <p className="text-foreground/80 font-medium">
                {cancelledOrder.notificacion}
              </p>

              <button 
                onClick={dismissCancellation}
                className="w-full bg-destructive hover:bg-destructive/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-destructive/20 transition-all text-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
