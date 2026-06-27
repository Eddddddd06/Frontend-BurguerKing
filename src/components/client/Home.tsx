import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Plus, Tag } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getMenu } from "../../services/api";
import { ImageWithFallback } from "../ImageWithFallback";

interface MenuItem {
  producto_id: string;
  tipo: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  es_favorito: boolean;
}

export function Home() {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isGuest, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getMenu();
        setMenuItems(data.menu || []);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const promos = menuItems.filter(item => item.tipo === 'promo');
  const carta = menuItems.filter(item => item.tipo === 'carta');

  const handleAddToCart = async (producto_id: string) => {
    if (isGuest || !isAuthenticated) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      navigate('/');
      return;
    }
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
          <p className="text-foreground/60 font-medium">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* HeroCarousel - only show if there are promos */}
      {promos.length > 0 && (
        <section className="bg-background relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {promos.map((promo, index) => (
                <div key={promo.producto_id} className="flex-[0_0_100%] min-w-0 relative h-[300px] sm:h-[400px]">
                  <div className={`absolute inset-0 ${index % 2 === 0 ? 'bg-[#502314]' : 'bg-primary'} mix-blend-multiply opacity-60 z-10`} />
                  <ImageWithFallback 
                    src={promo.imagen_url} 
                    alt={promo.nombre} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 lg:px-24 container mx-auto">
                    <span className="bg-success text-white px-3 py-1 text-sm font-bold uppercase rounded-md w-fit mb-4 flex items-center gap-1">
                      <Tag size={14} /> Oferta Especial
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display text-white mb-4 drop-shadow-md">
                      {promo.nombre}
                    </h1>
                    <p className="text-white/90 text-xl font-bold mb-4">S/ {promo.precio.toFixed(2)}</p>
                    <button 
                      onClick={() => handleAddToCart(promo.producto_id)}
                      className="bg-primary hover:bg-white hover:text-primary transition-colors text-white font-display font-bold py-3 px-8 rounded-full w-fit shadow-lg"
                    >
                      PIDE AQUÍ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 mt-12 flex flex-col gap-12">
        {/* PromoSection */}
        {promos.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-6 flex items-center gap-2">
              🔥 Promociones Imperdibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promos.slice(0, 2).map((promo, index) => (
                <div key={promo.producto_id} className={`${index === 0 ? 'bg-success' : 'bg-[#502314]'} rounded-[12px] p-6 text-white relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow`}>
                  <div className="relative z-10 w-2/3">
                    <h3 className="font-display text-2xl mb-2">{promo.nombre}</h3>
                    <p className="mb-2 text-white/90">S/ {promo.precio.toFixed(2)}</p>
                    <button 
                      onClick={() => handleAddToCart(promo.producto_id)}
                      className={`${index === 0 ? 'bg-white text-success' : 'bg-primary text-white'} font-bold py-2 px-6 rounded-full hover:opacity-90 transition-colors`}
                    >
                      Pide Aquí
                    </button>
                  </div>
                  <ImageWithFallback 
                    src={promo.imagen_url} 
                    alt={promo.nombre}
                    className={`absolute -right-10 -bottom-10 w-64 h-64 object-cover rounded-full border-4 ${index === 0 ? 'border-success' : 'border-[#502314]'} group-hover:scale-105 transition-transform`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state if no promos */}
        {promos.length === 0 && (
          <section>
            <h2 className="font-display text-2xl mb-6 flex items-center gap-2">
              🔥 Promociones
            </h2>
            <div className="bg-card rounded-[12px] border border-border p-8 text-center">
              <p className="text-foreground/60">Aún no hay promociones disponibles. ¡Vuelve pronto!</p>
            </div>
          </section>
        )}

        {/* CategorySection */}
        <section>
          <h2 className="font-display text-2xl mb-6">Nuestra Carta</h2>
          
          {carta.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {carta.map((product) => (
                <div key={product.producto_id} className="bg-card rounded-[12px] shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
                    {product.es_favorito && (
                      <span className="absolute top-3 left-3 bg-success text-white text-[10px] font-bold px-2 py-1 rounded uppercase z-10">
                        Favorito
                      </span>
                    )}
                    <ImageWithFallback 
                      src={product.imagen_url} 
                      alt={product.nombre}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.nombre}</h3>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="font-display font-bold text-xl text-primary">
                        S/ {product.precio.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleAddToCart(product.producto_id)}
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
            <div className="bg-card rounded-[12px] border border-border p-8 text-center">
              <p className="text-foreground/60">Aún no hay productos en la carta. ¡El admin los añadirá pronto!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
