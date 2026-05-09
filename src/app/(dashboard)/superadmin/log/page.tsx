"use client";

import { useEffect, useState } from "react";
import { Activity, Search, AlertCircle, Clock, Loader2, Download } from "lucide-react";

interface LogEntry {
  id: string;
  tipo: "barberia" | "usuario" | "pago" | "cita" | "sistema";
  mensaje: string;
  entidad_id: string | null;
  entidad_nombre: string | null;
  usuario_email: string;
  rol: string;
  fecha: Date | string;
  metadata: Record<string, unknown>;
}

const TIPO_COLORS: Record<string, string> = {
  barberia: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  usuario: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  pago: "text-green-400 bg-green-400/10 border-green-400/20",
  cita: "text-[var(--gold)] bg-[var(--gold)]/10 border-[var(--gold)]/20",
  sistema: "text-[var(--muted)] bg-zinc-800 border-zinc-700",
};

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    try {
      const tokenRes = await fetch("/api/auth/me");
      if (!tokenRes.ok) return;
      const token = (window as unknown as { __authToken?: string }).__authToken;

      const res = await fetch("/api/log?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportarLogs = () => {
    const csv = [
      ["ID", "Tipo", "Mensaje", "Usuario", "Rol", "Fecha"].join(","),
      ...logs.map((l) =>
        [l.id, l.tipo, `"${l.mensaje}"`, l.usuario_email, l.rol, new Date(l.fecha).toISOString()].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-barberapp-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTipoBadge = (tipo: string) => {
    const icons: Record<string, React.ReactNode> = {
      barberia: "🏪",
      usuario: "👤",
      pago: "💳",
      cita: "📅",
      sistema: "⚙️",
    };
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase ${TIPO_COLORS[tipo] || "text-[var(--muted)] bg-zinc-800 border-zinc-700"}`}>
        {icons[tipo] || "📋"} {tipo}
      </span>
    );
  };

  const logsFiltrados = logs.filter((log) => {
    const porTipo = !filtroTipo || log.tipo === filtroTipo;
    const porBusqueda = !search ||
      log.mensaje.toLowerCase().includes(search.toLowerCase()) ||
      log.usuario_email.toLowerCase().includes(search.toLowerCase());
    return porTipo && porBusqueda;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gold-text-gradient flex items-center gap-3">
            <Activity className="text-[var(--gold)]" />
            Logs del Sistema
          </h1>
          <p className="text-[var(--muted)]">Historial detallado de todas las acciones administrativas y eventos críticos.</p>
        </div>
        <button
          onClick={exportarLogs}
          className="flex items-center gap-2 px-4 py-2 border border-[rgba(201,168,76,0.3)] text-[var(--gold)] rounded-lg font-bold hover:bg-[rgba(201,168,76,0.1)] transition-colors"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-4 items-center bg-[var(--card)] p-4 rounded-xl border border-[rgba(201,168,76,0.18)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por acción, usuario o detalles..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold)]"
          >
            <option value="">Todos los tipos</option>
            <option value="barberia">Barbería</option>
            <option value="usuario">Usuario</option>
            <option value="pago">Pago</option>
            <option value="cita">Cita</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[rgba(201,168,76,0.18)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-[var(--gold)] animate-spin" />
            <p className="text-[var(--muted)]">Consultando logs...</p>
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-12 h-12 text-[var(--muted)] opacity-50" />
            <p className="text-[var(--muted)]">
              {search || filtroTipo ? "No hay resultados para esos filtros" : "No hay logs registrados todavía"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[rgba(201,168,76,0.05)] text-[var(--gold)] text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Mensaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,168,76,0.1)]">
              {logsFiltrados.map((log) => (
                <tr key={log.id} className="hover:bg-[rgba(201,168,76,0.02)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--white)]">
                      <Clock size={14} className="text-[var(--muted)]" />
                      {new Date(log.fecha).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-[var(--white)]">{log.usuario_email}</div>
                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{log.rol}</div>
                  </td>
                  <td className="px-6 py-4">{getTipoBadge(log.tipo)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[var(--white)]">{log.mensaje}</div>
                    {log.entidad_nombre && (
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">{log.entidad_nombre}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}