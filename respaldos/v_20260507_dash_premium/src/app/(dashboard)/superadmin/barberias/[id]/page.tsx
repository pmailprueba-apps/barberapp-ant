"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { barberiaService } from "@/services/barberiaService";
import { Barberia } from "@/types/firebase";
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Settings, 
  Clock, 
  Calendar, 
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { ConfirmCancelModal } from "@/components/ui/confirm-cancel-modal";
import { toast } from "sonner";

export default function BarberiaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [barberia, setBarberia] = useState<Barberia | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<"activa" | "suspendida" | null>(null);

  useEffect(() => {
    if (params.id) {
      loadBarberia();
    }
  }, [params.id]);

  const loadBarberia = async () => {
    try {
      const data = await barberiaService.getById(params.id as string);
      setBarberia(data);
    } catch (error) {
      console.error("Error loading barberia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberia) return;
    setSaving(true);
    try {
      await barberiaService.update(barberia.id, barberia);
      toast.success("Cambios guardados correctamente");
      router.refresh();
    } catch (error) {
      console.error("Error updating barberia:", error);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!barberia) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!barberia) return;
    try {
      toast.promise(
        barberiaService.delete(barberia.id).then(() => router.push("/superadmin/barberias")),
        {
          loading: "Eliminando barbería...",
          success: "Barbería eliminada",
          error: "Error al eliminar"
        }
      );
    } catch (error) {
      console.error("Error deleting barberia:", error);
    }
  };

  const handleStatusChange = async (newStatus: "activa" | "suspendida") => {
    if (!barberia) return;
    setPendingStatusChange(newStatus);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = async (reason: string) => {
    if (!barberia || !pendingStatusChange) return;
    try {
      await barberiaService.updateStatus(barberia.id, pendingStatusChange);
      setBarberia({ ...barberia, estado: pendingStatusChange });
      toast.success(`Estado actualizado a ${pendingStatusChange}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar estado");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[var(--muted)]">Cargando detalles de la barbería...</p>
    </div>
  );

  if (!barberia) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-white mb-2">Barbería no encontrada</h2>
      <Link href="/superadmin/barberias" className="text-[var(--gold)] hover:underline">Volver a la lista</Link>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/superadmin/barberias" 
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-[var(--muted)] hover:text-white"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              {barberia.nombre}
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
                barberia.estado === 'activa' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {barberia.estado}
              </span>
            </h1>
            <p className="text-[var(--muted)] flex items-center gap-1">
              ID: <span className="font-mono text-xs">{barberia.id}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 rounded-lg font-bold hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
          <button 
            onClick={handleUpdate}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--gold)] text-[var(--dark)] rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--card)] p-8 rounded-2xl border border-[rgba(201,168,76,0.18)] shadow-xl">
            <h2 className="text-xl font-bold text-[var(--gold)] mb-6 flex items-center gap-2">
              <Settings size={20} /> Configuración General
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--muted)] uppercase flex items-center gap-2">
                  <Building2 size={14} /> Nombre del Negocio
                </label>
                <input 
                  type="text" 
                  value={barberia.nombre}
                  onChange={e => setBarberia({...barberia, nombre: e.target.value})}
                  className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-xl px-4 py-3 text-white focus:border-[var(--gold)] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--muted)] uppercase flex items-center gap-2">
                  <Mail size={14} /> Email de Contacto
                </label>
                <input 
                  type="email" 
                  value={barberia.email}
                  onChange={e => setBarberia({...barberia, email: e.target.value})}
                  className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-xl px-4 py-3 text-white focus:border-[var(--gold)] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--muted)] uppercase flex items-center gap-2">
                  <Phone size={14} /> Teléfono
                </label>
                <input 
                  type="tel" 
                  value={barberia.telefono}
                  onChange={e => setBarberia({...barberia, telefono: e.target.value})}
                  className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-xl px-4 py-3 text-white focus:border-[var(--gold)] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--muted)] uppercase flex items-center gap-2">
                  <MapPin size={14} /> Dirección
                </label>
                <input 
                  type="text" 
                  value={barberia.direccion}
                  onChange={e => setBarberia({...barberia, direccion: e.target.value})}
                  className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-xl px-4 py-3 text-white focus:border-[var(--gold)] outline-none transition-all" 
                />
              </div>
            </form>
          </div>

          <div className="bg-[var(--card)] p-8 rounded-2xl border border-[rgba(201,168,76,0.18)] shadow-xl">
            <h2 className="text-xl font-bold text-[var(--gold)] mb-6 flex items-center gap-2">
              <Clock size={20} /> Horarios de Atención
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(barberia.horarios || {}).map(([dia, config]) => (
                <div key={dia} className="flex items-center justify-between p-3 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.05)]">
                  <span className="capitalize text-white font-medium">{dia}</span>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    {(config as any).activo ? (
                      <>
                        <span className="text-[var(--gold)]">{(config as any).abre}</span>
                        <span>-</span>
                        <span className="text-[var(--gold)]">{(config as any).cierra}</span>
                      </>
                    ) : (
                      <span className="text-red-500/50">Cerrado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.18)] shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6">Plan y Suscripción</h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <p className="text-xs text-[var(--muted)] uppercase font-bold mb-1">Plan Actual</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[var(--gold)] uppercase">{barberia.plan}</span>
                  <button className="text-xs text-blue-400 hover:underline">Cambiar Plan</button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-[var(--gold)]"><Calendar size={20} /></div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Próximo Pago</p>
                    <p className="text-sm text-white font-bold">04 Jun 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-[var(--gold)]"><CreditCard size={20} /></div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Método de Pago</p>
                    <p className="text-sm text-white font-bold">Visa **** 1234</p>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
                Ver Facturación
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.18)] shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full p-3 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-all text-left">
                📧 Enviar Recordatorio de Pago
              </button>
              {barberia.estado === 'activa' ? (
                <button 
                  onClick={() => handleStatusChange('suspendida')}
                  className="w-full p-3 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm font-bold border border-yellow-500/20 hover:bg-yellow-500/20 transition-all text-left"
                >
                  ⚠️ Suspender Cuenta Temporalmente
                </button>
              ) : (
                <button 
                  onClick={() => handleStatusChange('activa')}
                  className="w-full p-3 rounded-lg bg-green-500/10 text-green-500 text-sm font-bold border border-green-500/20 hover:bg-green-500/20 transition-all text-left"
                >
                  ✅ Reactivar Cuenta
                </button>
              )}
              <button className="w-full p-3 rounded-lg bg-zinc-800 text-white text-sm font-bold border border-zinc-700 hover:bg-zinc-700 transition-all text-left">
                🔓 Resetear Acceso Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmCancelModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        titulo="Eliminar Barbería"
        descripcion={`¿Estás seguro de que deseas eliminar "${barberia.nombre}"? Esta acción no se puede deshacer.`}
        nombreCliente={barberia.nombre}
      />

      <ConfirmCancelModal
        isOpen={statusConfirmOpen}
        onClose={() => {
          setStatusConfirmOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        titulo={pendingStatusChange === 'suspendida' ? "Suspender Cuenta" : "Reactivar Cuenta"}
        descripcion={pendingStatusChange === 'suspendida' ? "¿Deseas suspender temporalmente esta barbería?" : "¿Deseas reactivar esta barbería?"}
        nombreCliente={barberia.nombre}
      />
    </div>
  );
}
