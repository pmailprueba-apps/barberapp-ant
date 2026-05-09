"use client";

import { useAuth } from "@/hooks/useAuth";
import { Users, Search, Mail, Phone, Calendar, Loader2 } from "lucide-react";

export default function ClientesPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Base de Clientes</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Gestiona y contacta a tus clientes frecuentes</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            className="pl-10 pr-4 py-2 rounded-xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] text-sm text-[var(--white)] focus:border-[var(--gold)] outline-none transition-colors w-64"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">Última Cita</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--gold)] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,168,76,0.1)]">
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                No hay clientes registrados todavía.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
