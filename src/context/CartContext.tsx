import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (producto_id: string, cantidad?: number) => Promise<void>;
  removeItem: (producto_id: string) => Promise<void>;
  clearLocalCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, sede } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getCart(sede);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setItemCount(data.cantidad_productos || 0);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, sede]);

  const addItem = useCallback(async (producto_id: string, cantidad: number = 1) => {
    setLoading(true);
    try {
      await apiAddToCart(producto_id, cantidad, sede);
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCart, sede]);

  const removeItem = useCallback(async (producto_id: string) => {
    setLoading(true);
    try {
      await apiRemoveFromCart(producto_id, sede);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCart, sede]);

  const clearLocalCart = useCallback(() => {
    setItems([]);
    setTotal(0);
    setItemCount(0);
  }, []);

  return (
    <CartContext.Provider value={{ items, total, itemCount, loading, fetchCart, addItem, removeItem, clearLocalCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
