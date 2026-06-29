const API_BASE = 'https://lmhhjsjxlc.execute-api.us-east-1.amazonaws.com/dev';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || `Error ${res.status}`);
  }
  return data;
}

// ============ AUTH ============
export async function loginUser(email: string, password: string): Promise<{ token: string; rol: string }> {
  const res = await fetch(`${API_BASE}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function registerUser(data: {
  nombre: string;
  email: string;
  password: string;
  direccion: string;
  departamento: string;
}): Promise<{ mensaje: string; usuario_id: string }> {
  const res = await fetch(`${API_BASE}/usuarios/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function seedUser(data: {
  email: string;
  password: string;
  rol: 'admin' | 'empleado';
  sede: string;
}): Promise<{ mensaje: string; usuario_id: string }> {
  const res = await fetch(`${API_BASE}/admin/seed-usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============ MENU ============
export async function getMenu(sede: string): Promise<{ menu: Array<{
  producto_id: string;
  tipo: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  es_favorito: boolean;
}> }> {
  const res = await fetch(`${API_BASE}/menu?sede=${sede}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function addMenuItem(data: {
  tipo: string;
  nombre: string;
  precio: number;
  imagen_base64: string;
}): Promise<{ mensaje: string; producto_id: string }> {
  const res = await fetch(`${API_BASE}/admin/menu`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============ PROFILE ============
export async function getProfile(): Promise<{
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
}> {
  const res = await fetch(`${API_BASE}/perfil`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ============ CART ============
export async function getCart(sede: string): Promise<{
  items: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total: number;
  cantidad_productos: number;
}> {
  const res = await fetch(`${API_BASE}/carrito?sede=${sede}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function addToCart(producto_id: string, cantidad: number = 1, sede: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_BASE}/carrito`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ producto_id, cantidad, sede }),
  });
  return handleResponse(res);
}

export async function removeFromCart(producto_id: string, sede: string): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_BASE}/carrito/${producto_id}?sede=${sede}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ============ ORDERS ============
export async function createWebOrder(data: {
  direccion_entrega?: string;
  departamento_entrega?: string;
  sede: string;
}): Promise<{
  pedido_id: string;
  total: number;
  estado: string;
  direccion_entrega: string;
  departamento_entrega: string;
}> {
  const res = await fetch(`${API_BASE}/pedidos/web`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function payOrder(pedido_id: string, numero_tarjeta: string, sede: string): Promise<{
  mensaje: string;
  estado_actual: string;
}> {
  const res = await fetch(`${API_BASE}/pedidos/${pedido_id}/pagar`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ numero_tarjeta, sede }),
  });
  return handleResponse(res);
}

// ============ EMPLOYEE ============
export async function getWorkQueue(): Promise<{
  cola: Array<{
    pedido_id: string;
    paso_actual: string;
    estado: string;
    origen: string;
    items_a_preparar: Array<{
      producto_id: string;
      nombre: string;
      cantidad: number;
    }>;
  }>;
  mensaje?: string;
}> {
  const res = await fetch(`${API_BASE}/empleados/cola`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function completeStep(pedido_id: string, accion: 'completar' | 'cancelar' = 'completar'): Promise<{
  mensaje: string;
  siguiente_paso: string;
}> {
  const res = await fetch(`${API_BASE}/empleados/completar-paso`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pedido_id, accion }),
  });
  return handleResponse(res);
}
