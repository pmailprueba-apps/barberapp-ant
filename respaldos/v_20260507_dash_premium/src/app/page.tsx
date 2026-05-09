import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--dark)] p-8">
      <div className="text-center max-w-xl">
        <h1 className="text-6xl font-bold gold-text-gradient mb-4">BarberApp</h1>
        <p className="text-xl text-[var(--muted)] mb-8">
          Sistema de gestión para barberías en San Luis Potosí
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-4 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="mt-8 text-sm text-[var(--muted)]">
          ¿Eres dueño de barbería? Contacta al Super Admin para registrar tu negocio.
        </p>
      </div>
    </div>
  );
}
