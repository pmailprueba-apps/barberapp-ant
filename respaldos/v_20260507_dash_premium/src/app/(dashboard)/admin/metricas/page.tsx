"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatPrecio } from "@/lib/utils";
import { BarChart3, Calendar, Clock, TrendingUp, Loader2, Users } from "lucide-react";
import { userService } from "@/services/userService";
import { Usuario } from "@/types/firebase";

interface Metricas {
  ventasPorDia: Record<string, number>;
  ventasPorMes: Record<string, number>;
  ventasPorHora: Record<string, number>;
  totalVentas: number;
  totalCitas: number;
}

export default function MetricasPage() {
  const { user } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [barberos, setBarberos] = useState<Usuario[]>([]);
  const [selectedBarbero, setSelectedBarbero] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.barberia_id) {
      cargarDatosIniciales();
    }
  }, [user?.barberia_id]);

  useEffect(() => {
    if (user?.barberia_id) {
      cargarMetricas();
    }
  }, [selectedBarbero]);

  const cargarDatosIniciales = async () => {
    if (!user?.barberia_id) return;
    try {
      const users = await userService.getByBarberia(user.barberia_id);
      setBarberos(users.filter(u => u.role === "barbero"));
      await cargarMetricas();
    } catch (e) {
      console.error(e);
    }
  };

  const cargarMetricas = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const url = `/api/barberias/${user?.barberia_id}/metricas${selectedBarbero ? `?barberoId=${selectedBarbero}` : ""}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMetricas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!metricas) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--white)]">Métricas de Negocio</h1>
          <p className="text-[var(--muted)] mt-1">Análisis de rendimiento y ventas de tu barbería</p>
        </div>

        {/* Filtro por Barbero */}
        <div className="flex items-center gap-3 bg-[var(--card)] p-2 rounded-2xl border border-[rgba(201,168,76,0.15)] shadow-lg">
          <div className="p-2 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)]">
            <Users className="w-5 h-5" />
          </div>
          <select
            value={selectedBarbero}
            onChange={(e) => setSelectedBarbero(e.target.value)}
            className="bg-transparent text-sm font-bold text-[var(--white)] outline-none pr-8 cursor-pointer appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23c9a84c\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '1rem' }}
          >
            <option value="" className="bg-[var(--dark)]">Todos los barberos</option>
            {barberos.map((b) => (
              <option key={b.uid} value={b.uid} className="bg-[var(--dark)]">
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas Totales" 
          value={formatPrecio(metricas.totalVentas)} 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="text-[var(--gold)]"
        />
        <StatCard 
          title="Citas Completadas" 
          value={metricas.totalCitas.toString()} 
          icon={<BarChart3 className="w-5 h-5" />} 
          color="text-blue-400"
        />
        <StatCard 
          title="Ticket Promedio" 
          value={formatPrecio(metricas.totalCitas > 0 ? metricas.totalVentas / metricas.totalCitas : 0)} 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="text-green-400"
        />
        <StatCard 
          title="Estado" 
          value="Activo" 
          icon={<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />} 
          color="text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Meses */}
        <ChartContainer title="Ventas por Mes" icon={<Calendar className="w-5 h-5" />}>
          <SimpleBarChart data={metricas.ventasPorMes} />
        </ChartContainer>

        {/* Gráfico de Horas */}
        <ChartContainer title="Ventas por Hora (Picos)" icon={<Clock className="w-5 h-5" />}>
          <SimpleBarChart data={metricas.ventasPorHora} prefix="H" />
        </ChartContainer>
      </div>

      {/* Tabla de Días */}
      <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
           <Calendar className="w-6 h-6 text-[var(--gold)]" />
           <h2 className="text-xl font-bold text-white">Ventas Diarias (Últimos registros)</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(metricas.ventasPorDia)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([dia, total]) => (
              <div key={dia} className="flex items-center justify-between p-4 rounded-xl bg-[var(--dark)]/50 border border-[rgba(201,168,76,0.05)] hover:border-[var(--gold)]/20 transition-all">
                <span className="font-bold text-[var(--muted)]">{dia}</span>
                <span className="font-black text-[var(--gold)] text-lg">{formatPrecio(total)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="p-6 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.1)] shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)] mb-2">{title}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function ChartContainer({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)]">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SimpleBarChart({ data, prefix = "" }: { data: Record<string, number>, prefix?: string }) {
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...entries.map(e => e[1]), 1);

  if (entries.length === 0) {
    return <div className="h-48 flex items-center justify-center text-[var(--muted)] text-sm">Sin datos suficientes</div>;
  }

  return (
    <div className="flex items-end gap-2 h-48 overflow-x-auto pb-4 custom-scrollbar">
      {entries.map(([label, value]) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-2 group min-w-[40px]">
          <div className="relative w-full flex flex-col items-center">
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-[var(--gold)] text-[10px] font-bold px-2 py-1 rounded border border-[var(--gold)]/30 z-10 whitespace-nowrap">
              {formatPrecio(value)}
            </div>
            <div 
              className="w-full bg-[var(--gold)] rounded-t-lg transition-all duration-500 group-hover:brightness-125"
              style={{ height: `${(value / max) * 120}px` }}
            />
          </div>
          <span className="text-[9px] font-black text-[var(--muted)] uppercase truncate w-full text-center">
            {prefix}{label}
          </span>
        </div>
      ))}
    </div>
  );
}
