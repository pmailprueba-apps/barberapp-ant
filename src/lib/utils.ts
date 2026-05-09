// Formatear fecha a formato legible en español
export function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split("-");
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
}

// Formatear hora (09:00 → 9:00 AM)
export function formatHora(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// Convertir hora string a minutos desde medianoche
export function parseTime(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// Convertir minutos a hora string
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Combinar fecha + hora en Date
export function parseFechaHora(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}

// Día de la semana en español
export function getDiaSemana(fecha: string): string {
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const date = new Date(fecha + "T00:00:00");
  return dias[date.getDay()];
}

// Verificar si una fecha es pasado
export function esFechaPasada(fecha: string): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaCheck = new Date(fecha + "T00:00:00");
  return fechaCheck < hoy;
}

// Formatear precio MXN
export function formatPrecio(precio: number): string {
  return `$${precio.toLocaleString("es-MX")} MXN`;
}

// Calcular puntos por servicio
export function calcularPuntos(precio: number, puntosPorPesos = 10): number {
  return Math.floor(precio / puntosPorPesos);
}

// Diferencia en minutos entre dos horas
export function diferenciaMinutos(hora1: string, hora2: string): number {
  return parseTime(hora2) - parseTime(hora1);
}

// Slugify para nombres
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
