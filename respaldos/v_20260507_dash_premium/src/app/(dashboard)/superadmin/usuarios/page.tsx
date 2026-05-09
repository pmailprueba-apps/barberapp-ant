"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Search, Shield, MoreVertical, Loader2, Key } from "lucide-react";
import { userService } from "@/services/userService";
import { Usuario } from "@/types/firebase";
import { ROLES } from "@/types/roles";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { ConfirmCancelModal } from "@/components/ui/confirm-cancel-modal";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setResetEmail(email);
    setResetConfirmOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!resetEmail) return;
    setActionLoading(resetEmail);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Correo de restablecimiento enviado");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Error: " + error.message);
    } finally {
      setActionLoading(null);
      setResetEmail(null);
    }
  };

  const filteredUsers = usuarios.filter(
    (u) =>
      (u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "" || u.role === roleFilter)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gold-text-gradient flex items-center gap-3">
            <Users className="text-[var(--gold)]" />
            Usuarios del Sistema
          </h1>
          <p className="text-[var(--muted)]">Gestiona las cuentas, roles y accesos globales.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-[var(--dark)] rounded-lg font-bold hover:opacity-90 transition-opacity">
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[var(--card)] p-4 rounded-xl border border-[rgba(201,168,76,0.18)]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold)]"
          >
            <option value="">Todos los roles</option>
            {Object.entries(ROLES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[rgba(201,168,76,0.18)] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-[rgba(201,168,76,0.05)] text-[var(--gold)] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">Usuario</th>
              <th className="px-6 py-4 font-bold">Rol</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold">Último Acceso</th>
              <th className="px-6 py-4 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,168,76,0.1)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
                    <p className="text-[var(--muted)]">Cargando usuarios...</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-[var(--muted)]">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-[rgba(201,168,76,0.02)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[rgba(201,168,76,0.2)] flex items-center justify-center text-[var(--gold)] font-bold shadow-inner">
                        {user.foto_url ? (
                          <img src={user.foto_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.nombre?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--white)] group-hover:text-[var(--gold)] transition-colors">
                          {user.nombre || "Sin nombre"}
                        </div>
                        <div className="text-xs text-[var(--muted)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                      user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      user.role === 'admin' ? 'bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {ROLES[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${user.activo ? "text-green-500" : "text-red-500"}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${user.activo ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"}`}></span>
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString() : "Nunca"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        disabled={actionLoading === user.email}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-[var(--muted)] hover:text-[var(--gold)] transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                        title="Resetear Contraseña"
                      >
                        {actionLoading === user.email ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Key size={16} />
                        )}
                        <span className="hidden lg:inline">Reset Pass</span>
                      </button>
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-[var(--muted)] hover:text-[var(--gold)] transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmCancelModal
        isOpen={resetConfirmOpen}
        onClose={() => {
          setResetConfirmOpen(false);
          setResetEmail(null);
        }}
        onConfirm={confirmResetPassword}
        titulo="Resetear Contraseña"
        descripcion={`¿Enviar correo de restablecimiento a ${resetEmail || ""}?`}
        nombreCliente={resetEmail || ""}
      />
    </div>
  );
}
