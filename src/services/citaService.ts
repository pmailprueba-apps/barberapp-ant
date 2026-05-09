import { Cita, CitaEstado } from "@/types/firebase";

export const CitaService = {
  async getByBarberia(
    barberiaId: string, 
    params?: { fecha?: string; barberoId?: string; estado?: string }, 
    token?: string,
    signal?: AbortSignal
  ): Promise<Cita[]> {
    const url = new URL(`/api/barberias/${barberiaId}/citas`, window.location.origin);
    if (params?.fecha) url.searchParams.append("fecha", params.fecha);
    if (params?.barberoId) url.searchParams.append("barberoId", params.barberoId);
    if (params?.estado) url.searchParams.append("estado", params.estado);
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { headers, signal });
    if (!res.ok) throw new Error("Error cargando citas");
    return res.json();
  },

  async updateEstado(barberiaId: string, citaId: string, estado: CitaEstado, data?: Partial<Cita>, token?: string): Promise<void> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/barberias/${barberiaId}/citas?citaId=${citaId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ estado, ...data }),
    });
    if (!res.ok) throw new Error("Error actualizando estado");
  },

  async cancelar(barberiaId: string, citaId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/barberias/${barberiaId}/citas?citaId=${citaId}`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error("Error cancelando cita");
  }
};
