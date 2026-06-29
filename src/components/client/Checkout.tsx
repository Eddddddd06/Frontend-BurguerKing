import { useState, useEffect } from "react";
import { CreditCard, MapPin, Building, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createWebOrder, payOrder } from "../../services/api";

export function Checkout() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [departamentoEntrega, setDepartamentoEntrega] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, sede } = useAuth();
  const { items, total, fetchCart, clearLocalCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchCart();
  }, [isAuthenticated, navigate, fetchCart]);

  const handleCreateOrder = async () => {
    setError("");
    setLoading(true);
    try {
      const payload: any = { sede };
      if (direccionEntrega.trim()) payload.direccion_entrega = direccionEntrega;
      if (departamentoEntrega.trim()) payload.departamento_entrega = departamentoEntrega;
      
      const data = await createWebOrder(payload);
      setPedidoId(data.pedido_id);
      setOrderTotal(data.total);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!pedidoId) return;
    if (!numeroTarjeta.trim()) {
      alert('Ingresa un número de tarjeta.');
      return;
    }
    setLoading(true);
    try {
      await payOrder(pedidoId, numeroTarjeta.replace(/\s/g, ''), sede);
      clearLocalCart();
      setIsPaymentModalOpen(false);
      alert('¡Pago procesado exitosamente! Tu pedido ha sido enviado a cocina. 🔥');
      navigate("/client/profile");
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-8">Completa tu Pedido</h1>

      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-[12px] p-6 shadow-sm border border-border">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2 border-b border-border pb-4">
              <MapPin className="text-primary" /> Dirección de Entrega
            </h2>
            
            <form className="space-y-4">
              <p className="text-sm text-foreground/60 mb-4 bg-primary/5 p-3 rounded-lg border border-primary/20">
                💡 Dejar en blanco para usar tu dirección base configurada en tu perfil.
              </p>

              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Dirección Exacta</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="text" 
                    name="direccion_entrega"
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    placeholder="Ej: Av. Javier Prado Este 1234"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Departamento / Ciudad</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="text" 
                    name="departamento_entrega"
                    value={departamentoEntrega}
                    onChange={(e) => setDepartamentoEntrega(e.target.value)}
                    placeholder="Ej: Lima"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-[12px] p-6 shadow-sm border border-border">
            <h2 className="font-display text-xl font-bold mb-4 border-b border-border pb-4">Resumen</h2>
            
            <div className="space-y-3 mb-6">
              {items.map(item => (
                <div key={item.producto_id} className="flex justify-between text-sm">
                  <span className="text-foreground/80">{item.cantidad}x {item.nombre}</span>
                  <span className="font-bold">S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-foreground/60">Tu carrito está vacío.</p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Total a Pagar</span>
                <span className="text-primary">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCreateOrder}
              disabled={loading || items.length === 0}
              className="w-full bg-success hover:bg-success/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-success/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Continuar al Pago'} {!loading && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-[12px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold">Pago Seguro</h2>
              <p className="text-white/80 text-sm mt-1">Monto a cobrar: S/ {orderTotal.toFixed(2)}</p>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80">Número de Tarjeta</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="text" 
                    name="numero_tarjeta"
                    value={numeroTarjeta}
                    onChange={(e) => setNumeroTarjeta(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full pl-10 pr-4 py-4 rounded-[12px] border-2 border-border bg-input-background focus:outline-none focus:border-primary focus:ring-primary text-lg tracking-widest font-mono transition-all"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-success font-bold mt-2">
                  <ShieldCheck size={14} /> Transacción encriptada y segura
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-4 rounded-[12px] font-bold text-foreground/60 hover:bg-black/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePay}
                  disabled={loading}
                  className="flex-[2] bg-primary hover:bg-primary/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-primary/20 transition-all text-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Pagar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
