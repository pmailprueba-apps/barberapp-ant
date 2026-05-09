import { Role } from "./roles";

export interface Barberia {
  id: string;
  nombre: string;
  slug: string;
  logo?: string | null;
  direccion: string;
  telefono: string;
  email?: string;
  plan?: "basico" | "pro" | "cadena";
  estado: "activa" | "suspendida" | "bloqueada" | "cancelada" | "pendiente";
  acceso_admin?: boolean;
  reservas_activas?: boolean;
  horarios?: Horarios;
  servicios?: Servicio[];
  dias_bloqueados?: string[];
  descripcion?: string;
  web?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  logo_url?: string;
  admin_uid?: string;
  dias_anticipacion?: number;
  margen_reserva_minutos?: number;
  creada_en: Date;
  proximo_pago: Date;
  actualizado_en?: Date;
}

export interface Horarios {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
  domingo: HorarioDia;
}

export interface HorarioDia {
  abre: string | null;
  cierra: string | null;
  activo: boolean;
}

export interface Servicio {
  id: string;
  nombre: string;
  duracion_min: number;
  precio: number;
  activo: boolean;
}

export interface Usuario {
  uid: string;
  barberia_id: string | null;
  role: Role;
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string;
  foto_url: string | null;
  activo: boolean;
  puntos: number;
  creado_en: Date;
  ultimo_acceso: Date | null;
  barbero_id?: string | null;
  servicios_que_ofrece?: string[];
  calificacion_promedio?: number;
  total_citas_completadas?: number;
}

export interface Cita {
  id: string;
  barberia_id: string;
  barbero_id: string;
  barberoId?: string; // API returns camelCase
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio_id: string;
  servicio_nombre: string;
  precio: number;
  duracion_min: number;
  fecha: string;
  hora: string;
  hora_fin: string;
  estado: CitaEstado;
  canal: "pwa" | "whatsapp" | "qr";
  agendada_en: Date;
  confirmacion_enviada_en: Date | null;
  recordatorio_enviado_en: Date | null;
  completada_en: Date | null;
  cancelada_en: Date | null;
  cancelada_por: "cliente" | "admin" | "barbero" | "sistema" | null;
  motivo_cancelacion: string | null;
  calificacion: number | null;
  comentario: string | null;
  notas_barbero?: string | null;
}

export type CitaEstado =
  | "confirmada"
  | "recordatorio_enviado"
  | "en_curso"
  | "completada"
  | "cancelada_cliente"
  | "cancelada_admin"
  | "cancelada_barbero"
  | "no_show";
