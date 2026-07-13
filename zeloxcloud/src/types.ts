export interface Comercio {
  id: string;
  nombre: string;
  telefono_whatsapp: string;
  direccion: string;
  categoria: string;
  instagram_url?: string;
  maps_url?: string;
  activo?: boolean;
}

export interface Producto {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url?: string;
  disponible: boolean;
}

export interface PedidoDetalle {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Pedido {
  id: string;
  comercio_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion?: string; // Add if they specify delivery address
  detalles: PedidoDetalle[];
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'linea';
  estado: 'pendiente' | 'preparando' | 'enviado';
  created_at?: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export type AppView = 'consumidor' | 'comerciante';
