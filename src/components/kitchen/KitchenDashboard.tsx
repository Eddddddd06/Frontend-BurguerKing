import { useState, useEffect } from "react";
import { Check, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getWorkQueue, completeStep } from "../../services/api";

interface OrderItem {
  producto_id: string;
  nombre: string;
  cantidad: number;
}

interface QueueOrder {
  pedido_id: string;
  paso_actual: string;
  estado: string;
  origen: string;
  items_a_preparar: OrderItem[];
}

export function KitchenDashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const { role, logout, email } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check role
  useEffect(() => {
    if (role !== 'empleado' && role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  // Fetch work queue
  const fetchQueue = async () => {
    try {
      const data = await getWorkQueue();
      setOrders(data.cola || []);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 5 seconds for new orders
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const advanceStatus = async (pedido_id: string) => {
    setCompleting(pedido_id);
    try {
      const result = await completeStep(pedido_id);
      alert(`✅ ${result.mensaje}`);
      // Refresh queue after completing step
      await fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Error al completar paso');
    } finally {
      setCompleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDIENTE_PAGO": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "EN_COCINA": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "EN_EMPAQUE": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "EN_REPARTO": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando cola de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-6 flex flex-col font-sans">
      <header className="flex justify-between items-center mb-8 bg-[#2A2A2A] p-4 rounded-xl border border-white/10">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <img src="/Logo/Logo_Burguer.png" alt="Burger King Logo" className="h-8 w-auto object-contain" />
            Pantalla de Cocina / KDS
          </h1>
          <p className="text-white/60 text-sm mt-1">Órdenes activas en cola: {orders.length}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#008537]/20 text-[#008537] px-3 py-1 rounded-full font-bold text-sm border border-[#008537]/30">
            SEDE: {email ? email.split('@')[0].split('.').slice(1).join(' ').replace('_', ' ').toUpperCase() || 'N/A' : 'N/A'}
          </div>
          <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
            >
              <List size={20} />
            </button>
          </div>
          <div className="text-2xl font-mono font-bold bg-black/50 px-4 py-2 rounded-lg border border-white/10">
            {currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-white underline text-sm ml-4">
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl mx-auto"}`}>
          {orders.map((order) => (
            <div key={order.pedido_id} className="bg-[#2A2A2A] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-xl">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <span className="font-mono text-xl font-bold">{order.pedido_id.substring(0, 8).toUpperCase()}</span>
                <span className="text-xs text-white/40 uppercase">{order.origen}</span>
              </div>
              
              <div className="px-4 py-2">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.estado)}`}>
                  {order.estado.replace(/_/g, " ")}
                </div>
              </div>

              <div className="p-4 flex-1">
                <ul className="space-y-3">
                  {order.items_a_preparar.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-lg font-medium">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                      {item.cantidad}x {item.nombre}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-black/20 mt-auto">
                <button 
                  onClick={() => advanceStatus(order.pedido_id)}
                  disabled={completing === order.pedido_id}
                  className="w-full bg-[#008537] hover:bg-[#008537]/80 text-white font-display font-bold py-4 rounded-xl shadow-lg shadow-[#008537]/20 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider disabled:opacity-50"
                >
                  <Check size={24} /> {completing === order.pedido_id ? 'Completando...' : 'Completar Paso'}
                </button>
              </div>
            </div>
          ))}
          
          {orders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-white/40 py-20">
              <Check size={64} className="mb-4 opacity-20" />
              <h2 className="text-2xl font-display">No hay pedidos en cola</h2>
              <p>¡Buen trabajo equipo!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
