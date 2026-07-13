import { Comercio, Producto, Pedido } from './types';

export const MOCK_COMERCIOS: Comercio[] = [
  {
    id: 'comercio-1',
    nombre: 'Pizzería Di Roma',
    telefono_whatsapp: '+5492612345678',
    direccion: 'Av. Arístides Villanueva 450, Mendoza',
    categoria: 'Restaurantes',
    instagram_url: 'https://instagram.com/di_roma_pizza',
    maps_url: 'https://maps.app.goo.gl/pizzeria-di-roma'
  },
  {
    id: 'comercio-2',
    nombre: 'Zelox Café Bistro',
    telefono_whatsapp: '+5492618765432',
    direccion: 'Belgrano 1205, Ciudad de Mendoza',
    categoria: 'Cafetería',
    instagram_url: 'https://instagram.com/zelox_cafe_bistro',
    maps_url: 'https://maps.app.goo.gl/zelox-cafe'
  },
  {
    id: 'comercio-3',
    nombre: 'Express Minimarket',
    telefono_whatsapp: '+5492615554433',
    direccion: 'San Martín 1820, Las Heras',
    categoria: 'Supermercado',
    instagram_url: 'https://instagram.com/express_minimarket',
    maps_url: 'https://maps.app.goo.gl/express-mini'
  },
  {
    id: 'comercio-4',
    nombre: 'Farmacia Nueva Estación',
    telefono_whatsapp: '+5492614445566',
    direccion: 'Av. Colón 150, Godoy Cruz',
    categoria: 'Farmacia',
    instagram_url: 'https://instagram.com/farmacia_nueva_estacion',
    maps_url: 'https://maps.app.goo.gl/farmacia-estacion'
  }
];

export const MOCK_PRODUCTOS: Producto[] = [
  // Pizzería Di Roma
  {
    id: 'prod-1-1',
    comercio_id: 'comercio-1',
    nombre: 'Pizza Muzarella Clásica',
    descripcion: 'Salsa de tomate natural de la casa, abundante muzzarella, aceitunas verdes y orégano seleccionado.',
    precio: 950,
    imagen_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-1-2',
    comercio_id: 'comercio-1',
    nombre: 'Pizza Fugazzeta Rellena',
    descripcion: 'Doble capa de masa rellena de jamón y queso, cubierta con abundante cebolla caramelizada, parmesano y orégano.',
    precio: 1350,
    imagen_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-1-3',
    comercio_id: 'comercio-1',
    nombre: 'Empanada Criolla de Carne',
    descripcion: 'Tradicional empanada cortada a cuchillo, horneada, jugosa y sazonada con comino y pimentón dulce.',
    precio: 120,
    imagen_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-1-4',
    comercio_id: 'comercio-1',
    nombre: 'Gaseosa Coca-Cola 1.5L',
    descripcion: 'Línea Coca-Cola original, refrescante y bien helada.',
    precio: 350,
    imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },

  // Zelox Café Bistro
  {
    id: 'prod-2-1',
    comercio_id: 'comercio-2',
    nombre: 'Capuccino Italiano',
    descripcion: 'Espresso de café de especialidad, leche espumada a la perfección y espolvoreado con cacao premium.',
    precio: 280,
    imagen_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-2-2',
    comercio_id: 'comercio-2',
    nombre: 'Croissant Relleno de Nutella',
    descripcion: 'Croissant hojaldrado con manteca natural, horneado diariamente y relleno de deliciosa crema de avellanas.',
    precio: 210,
    imagen_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-2-3',
    comercio_id: 'comercio-2',
    nombre: 'Avocado Toast Completo',
    descripcion: 'Tostada de pan de campo de masa madre, palta smash madura, huevo poché y semillas de sésamo.',
    precio: 490,
    imagen_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // placeholder
    disponible: true
  },

  // Express Minimarket
  {
    id: 'prod-3-1',
    comercio_id: 'comercio-3',
    nombre: 'Leche Entera La Serenísima 1L',
    descripcion: 'Leche entera fresca fortificada con vitaminas A y D.',
    precio: 220,
    imagen_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },
  {
    id: 'prod-3-2',
    comercio_id: 'comercio-3',
    nombre: 'Pack de Yerba Mate Playadito 1Kg',
    descripcion: 'Yerba elaborada con palo, de sabor suave y prolongado.',
    precio: 550,
    imagen_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  },

  // Farmacia Nueva Estación
  {
    id: 'prod-4-1',
    comercio_id: 'comercio-4',
    nombre: 'Ibuprofeno 400mg x 10 Comp.',
    descripcion: 'Analgésico y antiinflamatorio de venta libre de excelente calidad.',
    precio: 180,
    imagen_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    disponible: true
  }
];

export const MOCK_PEDIDOS: Pedido[] = [
  {
    id: 'ped-101',
    comercio_id: 'comercio-1',
    cliente_nombre: 'Mariano Benegas',
    cliente_telefono: '+5492615019283',
    cliente_direccion: 'Av. Emilio Civit 320, Ciudad, Mendoza',
    detalles: [
      { id: 'prod-1-1', nombre: 'Pizza Muzarella Clásica', precio: 950, cantidad: 1 },
      { id: 'prod-1-4', nombre: 'Gaseosa Coca-Cola 1.5L', precio: 350, cantidad: 1 }
    ],
    total: 1300,
    metodo_pago: 'efectivo',
    estado: 'pendiente',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id: 'ped-102',
    comercio_id: 'comercio-1',
    cliente_nombre: 'Gimena Flores',
    cliente_telefono: '+5492619042211',
    cliente_direccion: 'Arístides Villanueva 180, Dpto 3',
    detalles: [
      { id: 'prod-1-2', nombre: 'Pizza Fugazzeta Rellena', precio: 1350, cantidad: 1 }
    ],
    total: 1350,
    metodo_pago: 'transferencia',
    estado: 'preparando',
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'ped-103',
    comercio_id: 'comercio-1',
    cliente_nombre: 'Santiago Ortigoza',
    cliente_telefono: '+5492612349088',
    cliente_direccion: 'Sargento Cabral 812, Mendoza',
    detalles: [
      { id: 'prod-1-1', nombre: 'Pizza Muzarella Clásica', precio: 950, cantidad: 2 }
    ],
    total: 1900,
    metodo_pago: 'linea',
    estado: 'enviado',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  }
];
