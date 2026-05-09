"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { barberiaService } from "@/services/barberiaService";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Info, Loader2, Scissors } from "lucide-react";

export default function QRPage() {
  const { user } = useAuth();
  const [barberia, setBarberia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.barberia_id) {
      cargarBarberia(user.barberia_id);
    } else {
      setLoading(false);
    }
  }, [user?.barberia_id]);

  const cargarBarberia = async (id: string) => {
    try {
      const data = await barberiaService.getById(id);
      setBarberia(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${barberia?.slug || "barberia"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!barberia) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[rgba(201,168,76,0.18)]">
        <Info className="w-12 h-12 mx-auto mb-4 text-[var(--gold)]" />
        <h2 className="text-xl font-bold text-[var(--white)]">Primero configura tu barbería</h2>
        <p className="text-[var(--muted)] mt-2">Ve a la sección de Configuración para activar tu página pública.</p>
      </div>
    );
  }

  const landingUrl = `${window.location.origin}/b/${barberia.slug}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Sistema QR</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Genera códigos QR para que tus clientes accedan a tu barbería</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Card */}
        <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-black text-[var(--gold)]">{barberia.nombre}</h2>
            <p className="text-xs text-[var(--muted)] mt-1 break-all">{landingUrl}</p>
          </div>

          <div ref={qrRef} className="p-6 bg-white rounded-2xl shadow-2xl">
            <QRCodeSVG 
              value={landingUrl} 
              size={250}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/favicon.ico",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-black hover:opacity-90 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              Descargar QR
            </button>
            <button
              onClick={() => navigator.share?.({ title: barberia.nombre, url: landingUrl })}
              className="p-4 rounded-xl border border-[rgba(201,168,76,0.18)] text-[var(--gold)] hover:bg-[var(--gold)]/5 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[var(--dark)] to-[var(--card)] border border-[rgba(201,168,76,0.1)]">
            <h3 className="text-lg font-bold text-[var(--white)] mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-[var(--gold)]" />
              ¿Cómo usar el QR?
            </h3>
            
            <div className="space-y-6">
              {[
                { step: 1, text: "Descarga el código QR de tu barbería" },
                { step: 2, text: "Imprímelo en alta resolución (mínimo 5x5 cm)" },
                { step: 3, text: "Colócalo en la entrada o área de espera" },
                { step: 4, text: "Los clientes lo escanean con su cámara" },
                { step: 5, text: "Acceden directo a tu landing page y reservan" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[var(--gold)] text-[var(--dark)] flex items-center justify-center font-black flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-[var(--white)] font-medium pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--gold)]/5 border border-[var(--gold)]/20">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm text-[var(--muted)]">
                <strong className="text-[var(--gold)]">Tip:</strong> Puedes colocar el código en cada estación de corte para que tus clientes agenden su próxima cita antes de irse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}