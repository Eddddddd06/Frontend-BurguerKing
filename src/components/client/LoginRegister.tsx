import { useState } from "react";
import { User, Mail, Lock, MapPin, Building, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { loginUser, registerUser } from "../../services/api";

export function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, enterGuest } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let cleanEmail = email.trim();
      
      // Solo forzar minúsculas si detectamos que es un correo de empleado 
      // (termina en @burgerking.com y no empieza con admin.)
      if (cleanEmail.toLowerCase().endsWith("@burgerking.com") && !cleanEmail.toLowerCase().startsWith("admin.")) {
        cleanEmail = cleanEmail.toLowerCase();
      }

      const cleanPassword = password.trim();
      const data = await loginUser(cleanEmail, cleanPassword);
      login(data.token, data.rol, cleanEmail);

      // Redirect based on role from backend
      if (data.rol === "admin") {
        navigate("/admin");
      } else if (data.rol === "empleado") {
        navigate("/kitchen");
      } else {
        navigate("/client");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      await registerUser({ nombre, email: cleanEmail, password: cleanPassword, direccion, departamento });
      // After successful registration, auto-login
      const data = await loginUser(cleanEmail, cleanPassword);
      login(data.token, data.rol, cleanEmail);
      navigate("/client");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    enterGuest();
    navigate("/client");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <img src="/Logo/Logo_Letrasrojas.png" alt="Burger Kong Logo" className="mx-auto mb-8 h-20 w-auto object-contain" />
      
      <div className="bg-card rounded-[12px] shadow-sm border border-border w-full max-w-md overflow-hidden">
        
        <div className="p-6 text-center border-b border-border bg-black/5">
          <h1 className="font-display text-2xl font-bold text-primary mb-1">
            {isLogin ? "¿Listo para el festín?" : "Entra y hazlo a tu manera"}
          </h1>
          <p className="text-sm text-foreground/70">El Rey te estaba esperando</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-4 font-display font-bold text-center transition-colors ${isLogin ? "text-primary border-b-2 border-primary bg-primary/5" : "text-foreground/60 hover:text-foreground hover:bg-black/5"}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`flex-1 py-4 font-display font-bold text-center transition-colors ${!isLogin ? "text-primary border-b-2 border-primary bg-primary/5" : "text-foreground/60 hover:text-foreground hover:bg-black/5"}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Registrarme
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="password" 
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-sm text-primary font-bold hover:underline">¿Olvidaste tu contraseña?</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? "Ingresando..." : "Ingresar"} {!loading && <ArrowRight size={20} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="text" 
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre real"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-foreground/80">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                  <input 
                    type="password" 
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground/80">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                    <input 
                      type="text" 
                      name="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Av. Principal 123"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <p className="text-xs text-foreground/60 pt-1">Dinos dónde estás para que la comida llegue caliente.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground/80">Departamento</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                    <input 
                      type="text" 
                      name="departamento"
                      value={departamento}
                      onChange={(e) => setDepartamento(e.target.value)}
                      placeholder="Lima"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-border bg-input-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-display font-bold py-4 rounded-[12px] shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
              >
                {loading ? "Registrando..." : "Registrarme"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border flex flex-col items-center">
            <p className="text-sm text-foreground/60 mb-4">¿Solo quieres ver el menú?</p>
            <button 
              onClick={handleGuest}
              className="w-full bg-input-background hover:bg-black/5 text-foreground font-display font-bold py-3 rounded-[12px] border border-border transition-all"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
