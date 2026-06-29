import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { Search, MapPin, User, ShoppingCart, X, ChevronRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export function ClientLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest, isAuthenticated, sede, updateSede } = useAuth();
  const { items, total, itemCount, fetchCart, removeItem } = useCart();

  // Fetch cart on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Redirect guests away from protected routes
  useEffect(() => {
    if (isGuest && (location.pathname.includes("profile") || location.pathname.includes("checkout"))) {
      navigate("/");
    }
  }, [isGuest, location, navigate]);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (isGuest || !isAuthenticated) {
      alert('Debes iniciar sesión para continuar con el pago.');
      navigate("/");
    } else {
      navigate("/client/checkout");
    }
  };

  const handleCartOpen = () => {
    if (isGuest || !isAuthenticated) {
      alert('Debes iniciar sesión para ver tu carrito.');
      navigate("/");
      return;
    }
    setIsCartOpen(true);
  };

  const handleRemoveItem = async (producto_id: string) => {
    try {
      await removeItem(producto_id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  };

  const totalItemsInCart = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* TopAlertBanner */}
      <div className="bg-foreground text-card text-center py-1.5 text-sm font-medium tracking-wide">
        ¡Delivery gratis en tu primera compra con el código BKFREE!
      </div>

      {/* Header/NavBar */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Link to="/client" className="flex items-center gap-2">
              <img src="/Logo/Logo_Burguer.png" alt="Burger King Logo" className="h-10 w-auto object-contain" />
              <span className="hidden sm:inline font-display text-2xl font-bold tracking-tighter whitespace-nowrap">
                BURGER KING
              </span>
            </Link>

            <div className="hidden md:flex items-center bg-white/10 rounded-full px-3 py-1.5 w-full max-w-sm border border-white/20 focus-within:bg-white focus-within:text-foreground transition-colors">
              <Search size={18} className="text-current opacity-70" />
              <input
                type="text"
                placeholder="Buscar en el menú..."
                className="bg-transparent border-none outline-none px-2 w-full text-sm placeholder:text-current placeholder:opacity-60"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
              <MapPin size={16} className="text-white" />
              <select 
                value={sede} 
                onChange={(e) => updateSede(e.target.value)}
                className="bg-transparent border-none outline-none text-white cursor-pointer text-sm font-bold appearance-none"
              >
                <option value="barranco" className="text-black">Barranco</option>
                <option value="miraflores" className="text-black">Miraflores</option>
                <option value="san_isidro" className="text-black">San Isidro</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to={isGuest ? "/" : "/client/profile"}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
            >
              <User size={24} />
              <span className="hidden md:block text-sm font-medium">Mi Cuenta</span>
            </Link>

            <button
              onClick={handleCartOpen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
            >
              <ShoppingCart size={24} />
              {totalItemsInCart > 0 && (
                <span className="absolute top-0 right-0 bg-success text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary">
                  {totalItemsInCart}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* SubMenu */}
      <div className="bg-[#EBE0D6] border-b border-border/50">
        <div className="container mx-auto px-4 h-12 flex items-center gap-6 overflow-x-auto">
          <Link to="/client" className="font-display font-bold text-foreground text-sm hover:text-primary transition-colors whitespace-nowrap">
            CARTA
          </Link>
          <Link to="/client" className="font-display font-bold text-foreground text-sm hover:text-primary transition-colors whitespace-nowrap">
            PROMOCIONES
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Cart Sidebar Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-background">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            Tu Pedido
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-foreground/60 text-center">Tu carrito está vacío.<br/>¡Agrega algo del menú!</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.producto_id} className="flex items-center justify-between bg-background border border-border p-3 rounded-[12px]">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{item.nombre}</span>
                  <span className="text-xs text-foreground/60">Cantidad: {item.cantidad}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">
                    S/ {item.subtotal.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.producto_id)}
                    className="text-destructive/60 hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-border bg-background flex flex-col gap-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Subtotal</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckoutClick}
            disabled={items.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Ir a Pagar <ChevronRight size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
