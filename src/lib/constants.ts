// Planes disponibles
export const PLANES = {
  basico: { nombre: "Básico", precio: 299, barberos: 1, clientes: 100 },
  pro: { nombre: "Pro", precio: 599, barberos: 5, clientes: Infinity, puntos: true, whatsapp: true, reportes: true },
  cadena: { nombre: "Cadena", precio: 1299, barberos: Infinity, clientes: Infinity, puntos: true, whatsapp: true, reportes: true, marcaBlanca: true, pagos: true },
} as const;

// Servicios fijos (catálogo base)
export const SERVICIOS_CATALOGO = [
  { id: "corte_clasico", nombre: "Corte clásico", duracion_default: 30, precio_default: 120 },
  { id: "barba", nombre: "Barba", duracion_default: 20, precio_default: 80 },
  { id: "bigote", nombre: "Bigote", duracion_default: 10, precio_default: 40 },
  { id: "afeitado_full", nombre: "Afeitado full", duracion_default: 25, precio_default: 100 },
  { id: "cuidado_facial", nombre: "Cuidado facial", duracion_default: 40, precio_default: 150 },
] as const;

// Estados de barbería
export const ESTADO_BARBERIA = {
  activa: "Activa",
  suspendida: "Suspendida",
  bloqueada: "Bloqueada",
  cancelada: "Cancelada",
} as const;

// Estados de cita
export const ESTADO_CITA = {
  confirmada: "Confirmada",
  recordatorio_enviado: "Recordatorio enviado",
  en_curso: "En curso",
  completada: "Completada",
  cancelada_cliente: "Cancelada por cliente",
  cancelada_admin: "Cancelada por admin",
  cancelada_barbero: "Cancelada por barbero",
  no_show: "No se presentó",
} as const;

// Canales de cita
export const CANAL_CITA = {
  pwa: "App web",
  whatsapp: "WhatsApp",
  qr: "Código QR",
} as const;

// Puntos: 1 punto por cada $10 MXN
export const PUNTOS_POR_PESOS = 10;

// Límite de cancelación en minutos
export const LIMITE_CANCELACION_MINUTOS = 60;
