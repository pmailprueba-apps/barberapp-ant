"use client";

import { useEffect, useState } from "react";
import { CreditCard, DollarSign, ArrowUpRight, Search, Filter, Loader2, Calendar } from "lucide-react";
import { pagoService, Transaccion } from "@/services/pagoService";

export default function PagosPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [stats, setStats] = useState({
    ingresosTotales: 0,
    suscripcionesActivas: 0,
    pagosPendientes: 0,
    crecimientoMensual: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txData, statsData] = await Promise.all([
        pagoService.getRecientes(),
        pagoService.getStats()
      ]);
      setTransacciones(txData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading payments data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Ingresos Totales", value: `$${stats.ingresosTotales.toLocaleString()}`, change: `+${stats.crecimientoMensual}%`, icon: DollarSign, color: "text-green-500" },
    { label: "Suscripciones Activas", value: stats.suscripcionesActivas.toString(), change: "+3", icon: CreditCard, color: "text-[var(--gold)]" },
    { label: "Pendientes", value: `$${stats.pagosPendientes.toLocaleString()}`, change: "-5%", icon: ArrowUpRight, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold gold-text-gradient flex items-center gap-3">
          <CreditCard className="text-[var(--gold)]" />
          Pagos y Suscripciones
        </h1>
        <p className="text-[var(--muted)]">Monitoreo de transacciones y estados de cuenta globales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.18)] flex items-center justify-between shadow-lg hover:border-[var(--gold)]/30 transition-all">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1 uppercase font-bold tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[var(--white)]">{stat.value}</h3>
              <p className={`text-xs mt-1 font-medium ${stat.change.startsWith("+") ? "text-green-500" : "text-red-400"}`}>
                {stat.change} vs mes anterior
              </p>
            </div>
            <div className={`p-4 rounded-xl bg-zinc-800/50 border border-[rgba(201,168,76,0.1)] ${stat.color} shadow-inner`}>
              <stat.icon size={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--gold)]">●</span> Transacciones Recientes
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input 
                type="text" 
                placeholder="Buscar transacción..."
                className="pl-9 pr-4 py-2 bg-[var(--card)] border border-[rgba(201,168,76,0.18)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
            <button className="p-2 bg-[var(--card)] border border-[rgba(201,168,76,0.18)] rounded-lg text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl border border-[rgba(201,168,76,0.18)] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-[rgba(201,168,76,0.05)] text-[var(--gold)] text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 font-bold">ID Transacción</th>
                <th className="px-6 py-5 font-bold">Barbería</th>
                <th className="px-6 py-5 font-bold">Monto</th>
                <th className="px-6 py-5 font-bold">Fecha</th>
                <th className="px-6 py-5 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,168,76,0.1)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-[var(--gold)] animate-spin" />
                      <p className="text-[var(--muted)]">Consultando registros financieros...</p>
                    </div>
                  </td>
                </tr>
              ) : transacciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-12 h-12 text-zinc-700" />
                      <p className="text-[var(--muted)]">No se encontraron transacciones registradas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transacciones.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[rgba(201,168,76,0.02)] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--muted)] group-hover:text-[var(--gold)] transition-colors">
                      {tx.id.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--white)]">{tx.barberia_nombre}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase tracking-tighter">ID: {tx.barberia_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">${tx.monto.toLocaleString()}</div>
                      <div className="text-[10px] text-[var(--gold)] font-medium uppercase">{tx.moneda}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--white)]">
                        {tx.fecha?.toDate ? tx.fecha.toDate().toLocaleDateString() : new Date(tx.fecha).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {tx.fecha?.toDate ? tx.fecha.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black border tracking-widest ${
                        tx.estado === "completado" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        tx.estado === "pendiente" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {tx.estado}
                      </span>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
