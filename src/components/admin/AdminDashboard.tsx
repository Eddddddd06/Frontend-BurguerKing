import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Users, FileText, Plus, Image as ImageIcon, Save, UserPlus, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addMenuItem, seedUser } from "../../services/api";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"menu" | "personal">("menu");
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  // Menu form state
  const [menuData, setMenuData] = useState({
    nombre: "",
    tipo: "carta",
    precio: ""
  });
  const [fileBase64, setFileBase64] = useState<string>("");
  const [menuLoading, setMenuLoading] = useState(false);

  // Personnel form state
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPassword, setPersonalPassword] = useState("");
  const [personalRol, setPersonalRol] = useState<"empleado" | "admin">("empleado");
  const [personalLoading, setPersonalLoading] = useState(false);

  // Check role
  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("La imagen pesa más de 4 MB. Por favor, sube un archivo más pequeño.");
      e.target.value = "";
      setFileBase64("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64) {
      alert("Por favor, sube una imagen.");
      return;
    }

    setMenuLoading(true);
    try {
      const payload = {
        tipo: menuData.tipo,
        nombre: menuData.nombre,
        precio: Number(menuData.precio),
        imagen_base64: fileBase64
      };

      const result = await addMenuItem(payload);
      alert(`¡Producto guardado exitosamente! ID: ${result.producto_id}`);
      
      // Reset form
      setMenuData({ nombre: "", tipo: "carta", precio: "" });
      setFileBase64("");
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      alert(err.message || "Error al guardar producto");
    } finally {
      setMenuLoading(false);
    }
  };

  const handlePersonalSubmit = async () => {
    if (!personalEmail.trim() || !personalPassword.trim()) {
      alert("Completa email y contraseña.");
      return;
    }

    setPersonalLoading(true);
    try {
      const result = await seedUser({
        email: personalEmail,
        password: personalPassword,
        rol: personalRol
      });
      alert(`¡Usuario ${personalRol} creado exitosamente! ${result.mensaje}`);
      setPersonalEmail("");
      setPersonalPassword("");
    } catch (err: any) {
      alert(err.message || "Error al crear usuario");
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <img src="/Logo/Logo_Burguer.png" alt="Burger King Logo" className="h-8 w-auto object-contain" />
          <span className="font-display text-xl font-bold text-primary tracking-tighter">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("menu")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "menu" ? "bg-primary text-white" : "text-foreground/70 hover:bg-black/5"}`}
          >
            <FileText size={20} /> Gestión de Menú
          </button>
          <button 
            onClick={() => setActiveTab("personal")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "personal" ? "bg-primary text-white" : "text-foreground/70 hover:bg-black/5"}`}
          >
            <Users size={20} /> Creación de Personal
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-foreground/70 hover:bg-black/5 transition-colors">
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <h1 className="font-display text-xl font-bold">
            {activeTab === "menu" ? "Gestión de Menú" : "Creación de Personal"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-3xl mx-auto">
            
            {activeTab === "menu" && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-black/5">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Plus className="text-primary" /> Agregar Nuevo Producto
                  </h2>
                  <p className="text-sm text-foreground/60 mt-1">Completa los datos para añadir un item al catálogo y subir su imagen a S3.</p>
                </div>
                
                <form onSubmit={handleMenuSubmit} className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80">Nombre del Producto</label>
                      <input 
                        type="text" 
                        name="nombre"
                        required
                        value={menuData.nombre}
                        onChange={(e) => setMenuData({...menuData, nombre: e.target.value})}
                        placeholder="Ej: Whopper Extremo"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80">Tipo</label>
                      <select 
                        name="tipo"
                        value={menuData.tipo}
                        onChange={(e) => setMenuData({...menuData, tipo: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      >
                        <option value="carta">Carta (Menú Regular)</option>
                        <option value="promo">Promo (Oferta Especial)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80">Precio (S/)</label>
                      <input 
                        type="number" 
                        name="precio"
                        required
                        step="0.01"
                        value={menuData.precio}
                        onChange={(e) => setMenuData({...menuData, precio: e.target.value})}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-foreground/80">Imagen del Producto (Max 4MB)</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                        <input 
                          id="file-input"
                          type="file" 
                          accept=".png, .jpeg, .jpg"
                          required
                          onChange={handleFileChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-foreground/50 mt-1">Sube una imagen en alta resolución con fondo transparente o blanco. Se enviará a S3 en formato Base64.</p>
                      
                      {fileBase64 && (
                        <div className="mt-4 p-4 border border-border rounded-xl bg-black/5 flex items-center gap-4">
                          <img src={fileBase64} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                          <span className="text-sm text-foreground/70">Imagen lista para subir.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button 
                      type="submit" 
                      disabled={menuLoading}
                      className="bg-primary hover:bg-primary/90 text-white font-display font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={20} /> {menuLoading ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "personal" && (
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-black/5">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <UserPlus className="text-primary" /> Crear Cuenta Interna
                  </h2>
                  <p className="text-sm text-foreground/60 mt-1">Genera accesos para empleados de cocina o nuevos administradores.</p>
                </div>
                
                <form className="p-6 sm:p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handlePersonalSubmit(); }}>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Correo Electrónico</label>
                    <input 
                      type="email" 
                      name="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="empleado@burgerking.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Contraseña</label>
                    <input 
                      type="password" 
                      name="password"
                      value={personalPassword}
                      onChange={(e) => setPersonalPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80">Rol del Usuario</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center gap-3 bg-input-background ${personalRol === 'empleado' ? 'border-primary' : 'border-border'}`}>
                        <input 
                          type="radio" 
                          name="rol" 
                          value="empleado" 
                          checked={personalRol === 'empleado'}
                          onChange={() => setPersonalRol('empleado')}
                          className="text-primary w-4 h-4" 
                        />
                        <div>
                          <p className="font-bold text-sm">Empleado</p>
                          <p className="text-xs text-foreground/60">Acceso a pantalla de cocina KDS</p>
                        </div>
                      </label>
                      <label className={`border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center gap-3 bg-input-background ${personalRol === 'admin' ? 'border-primary' : 'border-border'}`}>
                        <input 
                          type="radio" 
                          name="rol" 
                          value="admin" 
                          checked={personalRol === 'admin'}
                          onChange={() => setPersonalRol('admin')}
                          className="text-primary w-4 h-4" 
                        />
                        <div>
                          <p className="font-bold text-sm">Admin</p>
                          <p className="text-xs text-foreground/60">Control total del sistema</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button 
                      type="submit" 
                      disabled={personalLoading}
                      className="bg-primary hover:bg-primary/90 text-white font-display font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus size={20} /> {personalLoading ? 'Creando...' : 'Crear Usuario Interno'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
